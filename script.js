(function ($) {
  var methods = {
    init: function (options) {
      return this.each(function () {
        const settings = {
          levels: [
            { level: "Easy", numbers: 70 },
            { level: "Medium", numbers: 30 },
            { level: "Hard", numbers: 20 }
          ]
        };

        const defaults = {
          matrix: [],
          domMatrix: [],
          numOfRows: 9,
          numOfCols: 9,
          level: 40,
          selected: null,
          selectedSolution: null,
          anwerTracker: {
            "1": 9, "2": 9, "3": 9,
            "4": 9, "5": 9, "6": 9,
            "7": 9, "8": 9, "9": 9
          }
        };

        let mistakeCount = 0;
        let hintsLeft = 3;
        let totalSeconds = 0;
        let timerInterval;
        let undoStack = [];
        let redoStack = [];
        let isCustomMode = false;

        function startTimer() {
          totalSeconds = 0;
          timerInterval = setInterval(() => {
            totalSeconds++;
            const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const s = String(totalSeconds % 60).padStart(2, '0');
            $("#timer").text(`${m}:${s}`);
          }, 1000);
        }

        function resetGame() {
          location.reload();
        }
        window.resetGame = resetGame;

        function checkForVictory() {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const cell = defaults.domMatrix[r][c];
              if (
                cell.children().length === 0 ||
                parseInt(cell.text()) !== defaults.matrix[r][c]
              ) return;
            }
          }
          clearInterval(timerInterval);
          $("#finalTime").text($("#timer").text());
          $("#victoryPopup").css("display", "flex");
        }

        function giveHint(matrix, domMatrix) {
          if (hintsLeft <= 0 || isCustomMode) return;
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              const cell = domMatrix[r][c];
              if (cell.children().length === 0) {
                cell.append(`<div class='sdk-solution'>${matrix[r][c]}</div>`);
                hintsLeft--;
                $("#hintBtn").text(`💡 Hint (${hintsLeft})`);
                if (hintsLeft === 0) $("#hintBtn").prop("disabled", true);
                checkForVictory();
                return;
              }
            }
          }
        }

        function isSafe(board, row, col, num) {
          for (let x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) return false;
          }
          const startRow = Math.floor(row / 3) * 3;
          const startCol = Math.floor(col / 3) * 3;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (board[startRow + i][startCol + j] === num) return false;
            }
          }
          return true;
        }

        function solveSudoku(board) {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (board[r][c] === 0) {
                for (let num = 1; num <= 9; num++) {
                  if (isSafe(board, r, c, num)) {
                    board[r][c] = num;
                    if (solveSudoku(board)) return true;
                    board[r][c] = 0;
                  }
                }
                return false;
              }
            }
          }
          return true;
        }

        if (options) $.extend(settings, options);
        const $this = $(this);
        $this.addClass('sdk-game');

        $this.createMatrix = function () {
          let matrix = [];
          for (let r = 0; r < 9; r++) {
            matrix[r] = [];
            for (let c = 0; c < 9; c++) {
              let number = (c + 1) + (r * 3) + (Math.floor(r / 3) % 3);
              number = number % 9 || 9;
              matrix[r][c] = number;
            }
          }
          // shuffle rows and columns
          for (let i = 0; i < 9; i += 3) {
            for (let j = 0; j < 3; j++) {
              const r1 = i + Math.floor(Math.random() * 3);
              const r2 = i + Math.floor(Math.random() * 3);
              [matrix[r1], matrix[r2]] = [matrix[r2], matrix[r1]];
            }
          }
          for (let i = 0; i < 9; i += 3) {
            for (let j = 0; j < 3; j++) {
              const c1 = i + Math.floor(Math.random() * 3);
              const c2 = i + Math.floor(Math.random() * 3);
              for (let r = 0; r < 9; r++) {
                [matrix[r][c1], matrix[r][c2]] = [matrix[r][c2], matrix[r][c1]];
              }
            }
          }
          return matrix;
        };

        $this.createCustomBoard = function () {
          defaults.domMatrix = [];
          const customBoard = $("<div class='sdk-table'></div>");
          for (let r = 0; r < 9; r++) {
            defaults.domMatrix[r] = [];
            const row = $("<div class='sdk-row'></div>");
            for (let c = 0; c < 9; c++) {
              const cell = $(`<div class='sdk-col' data-row='${r}' data-col='${c}' contenteditable='true'></div>`);
              defaults.domMatrix[r][c] = cell;
              row.append(cell);
            }
            customBoard.append(row);
          }
          $this.html("").append(customBoard);
        };

        $this.createDiffPicker = function () {
          const picker = $("<div class='sdk-picker sdk-no-show'></div>");
          settings.levels.forEach(lvl => {
            picker.append(`<div class='sdk-btn' data-level='${lvl.numbers}'>${lvl.level}</div>`);
          });
          $this.append(picker);

          picker.find(".sdk-btn").click(function () {
            picker.addClass("sdk-no-show");
            defaults.level = parseInt($(this).data("level"));

            setTimeout(() => {
              picker.remove();
              defaults.matrix = $this.createMatrix();
              $this.createTable();
              startTimer();
              $("#diffLevel").text($(this).text());

              $("#hintBtn").click(() => giveHint(defaults.matrix, defaults.domMatrix));
              $("#restartBtn").click(resetGame);

              $("#solveBtn").click(() => {
                const board = [];
                for (let r = 0; r < 9; r++) {
                  board[r] = [];
                  for (let c = 0; c < 9; c++) {
                    const text = defaults.domMatrix[r][c].text();
                    board[r][c] = text ? parseInt(text) : 0;
                  }
                }

                if (solveSudoku(board)) {
                  for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                      if (defaults.domMatrix[r][c].children().length === 0) {
                        defaults.domMatrix[r][c].html(`<div class='sdk-solution'>${board[r][c]}</div>`);
                      }
                    }
                  }
                  checkForVictory();
                } else {
                  alert("❌ Puzzle cannot be solved.");
                }
              });

              $("#undoBtn").click(() => {
                if (undoStack.length === 0) return;
                const move = undoStack.pop();
                redoStack.push(move);
                defaults.domMatrix[move.row][move.col].empty();
              });

              $("#redoBtn").click(() => {
                if (redoStack.length === 0) return;
                const move = redoStack.pop();
                undoStack.push(move);
                defaults.domMatrix[move.row][move.col].html(`<div class='sdk-solution'>${move.value}</div>`);
              });

              $("#playModeBtn").click(() => {
                location.reload();
              });

            }, 500);
          });

          setTimeout(() => picker.removeClass("sdk-no-show"), 500);
        };

        $this.createTable = function () {
          defaults.domMatrix = [];
          defaults.table = $("<div class='sdk-table sdk-no-show'></div>");
          for (let r = 0; r < 9; r++) {
            defaults.domMatrix[r] = [];
            const tempRow = $("<div class='sdk-row'></div>");
            if (r === 2 || r === 5) tempRow.addClass("sdk-border");
            for (let c = 0; c < 9; c++) {
              const cell = $("<div class='sdk-col' data-row='" + r + "' data-col='" + c + "'></div>");
              if (c === 2 || c === 5) cell.addClass("sdk-border");
              defaults.domMatrix[r][c] = cell;
              tempRow.append(cell);
            }
            defaults.table.append(tempRow);
          }
          $this.append(defaults.table);
          defaults.table.append("<div class='sdk-table-bk'></div>");

          let items = defaults.level;
          while (items > 0) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (defaults.domMatrix[r][c].children().length === 0) {
              defaults.domMatrix[r][c].append("<div class='sdk-solution'>" + defaults.matrix[r][c] + "</div>");
              defaults.anwerTracker[defaults.matrix[r][c].toString()]--;
              items--;
            }
          }

          defaults.table.find(".sdk-col").click(function () {
            $this.find(".sdk-solution").removeClass("sdk-helper");
            $this.find(".sdk-col").removeClass("sdk-selected");
            if ($(this).children().length === 0) {
              $(this).addClass("sdk-selected");
              defaults.selected = $(this);
              defaults.selectedSolution = defaults.matrix[$(this).data("row")][$(this).data("col")];
            } else {
              $this.highlightHelp(parseInt($(this).text()));
            }
          });

          $this.answerPicker();
          setTimeout(() => defaults.table.removeClass("sdk-no-show"), 300);
        };

        $this.answerPicker = function () {
          const answerContainer = $("<div class='sdk-ans-container'></div>");
          for (let a in defaults.anwerTracker) {
            answerContainer.append(`<div class='sdk-btn'>${a}</div>`);
          }
          answerContainer.find(".sdk-btn").click(function () {
            if (!defaults.selected || defaults.selected.children().length !== 0) return;
            const selectedNum = parseInt($(this).text());
            const r = parseInt(defaults.selected.data("row"));
            const c = parseInt(defaults.selected.data("col"));

            if (defaults.selectedSolution === selectedNum) {
              defaults.selected.append(`<div class='sdk-solution'>${selectedNum}</div>`);
              undoStack.push({ row: r, col: c, value: selectedNum });
              redoStack = [];
              checkForVictory();
            } else {
              mistakeCount++;
              $("#mistakeCount").text(mistakeCount);
              if (mistakeCount >= 3) {
                clearInterval(timerInterval);
                alert("❌ Game Over! Too many mistakes.");
                $(".sdk-col").off("click");
              }
            }
            defaults.selected.removeClass("sdk-selected");
          });
          $this.append(answerContainer);
        };

        $this.highlightHelp = function (number) {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (parseInt(defaults.domMatrix[r][c].text()) === number) {
                defaults.domMatrix[r][c].find(".sdk-solution").addClass("sdk-helper");
              }
            }
          }
        };

        defaults.matrix = $this.createMatrix();
        $this.createDiffPicker();

        $("#customModeBtn").click(() => {
          isCustomMode = true;
          clearInterval(timerInterval);
          $this.createCustomBoard();
          $("#diffLevel").text("Custom");
          $(".active-mode").removeClass("active-mode");
          $("#customModeBtn").addClass("active-mode");

function validateCustomBoard(board) {
  const tempBoard = board.map(row => row.slice());
  return solveSudoku(tempBoard);
}

function getCurrentCustomBoard() {
  const board = [];
  for (let r = 0; r < 9; r++) {
    board[r] = [];
    for (let c = 0; c < 9; c++) {
      const val = defaults.domMatrix[r][c].text();
      board[r][c] = val ? parseInt(val) : 0;
    }
  }
  return board;
}

function isValidPlacement(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if ((i !== col && board[row][i] === num) || (i !== row && board[i][col] === num)) {
      return false;
    }
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const r = startRow + i;
      const c = startCol + j;
      if ((r !== row || c !== col) && board[r][c] === num) {
        return false;
      }
    }
  }
  return true;
}

function highlightConflicts() {
  const board = getCurrentCustomBoard();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === 0) {
        defaults.domMatrix[r][c].removeClass("sdk-invalid");
        continue;
      }
      if (!isValidPlacement(board, r, c, val)) {
        defaults.domMatrix[r][c].addClass("sdk-invalid");
      } else {
        defaults.domMatrix[r][c].removeClass("sdk-invalid");
      }
    }
  }
}

setTimeout(() => {
  $(".sdk-col[contenteditable='true']").on("input", function () {
    const val = $(this).text().trim();
    if (val.length > 1 || (!/^[1-9]$/.test(val) && val !== "")) {
      $(this).text("");
      return;
    }
    highlightConflicts();
  });

  if ($("#startCustomBtn").length === 0) {
    const btn = $("<button id='startCustomBtn'>▶️ Start Game</button>").css({ marginTop: "10px" });
    $("#controls").append(btn);

    btn.click(() => {
      const board = getCurrentCustomBoard();
      if (!validateCustomBoard(board)) {
        alert("❌ This board has no solution!");
        return;
      }

      defaults.matrix = board;
      $this.html("");
      $this.createTable();
      startTimer();
      $("#diffLevel").text("Custom");
    });
  }
}, 500);

        });

      });
    }
  };

  $.fn.sudoku = function (method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sudoku');
    }
  };
})(jQuery);

$(document).ready(() => {
  $(".sudoku-game").sudoku({});
});
