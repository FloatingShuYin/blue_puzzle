// 判断设备
function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
                "SymbianOS", "Windows Phone",
                "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}

// Daniel Gorrie
// cookie
function cookieHelper() {
// 读取cookie
    this.readCookie = function (callback) {
        callback(this.getCookie("gs"));
    }

    this.writeCookie = function (game) {
        var d = new Date();
        d.setTime(d.getTime() + (300 * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        var toWrite = "gs=" +
            game.currentClicks + " " +
            game.bestLevel + " " +
            game.clicksForBest + " " +
            game.totalClicks + " " +
            game.level + " " +
            game.isFirstGame + " " +
            game.gb.board.toString() +
            "; " + expires;
        document.cookie = toWrite;
    }

    this.getCookie = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }
        return "";
    }
}

function styleHelper() {
    this.setGridSize = function (level) {
        var margin = this.getMargin(level)
        var res = ($('.container').width() - margin * level - 15) / (level);
        $('.gamesquare').css('margin-right', margin);
        $('.gamesquare').css('width', res);
        $('.gamesquare').css('height', res);
        $('.gamerow').css('height', res);
        $('.gamerow').css('margin-right', margin * (-1));
        $('.gamerow').css('margin-bottom', margin);
        $('.board').css('padding', margin);
        $('.board').css('padding-bottom', 0);
    }

    this.getMargin = function (level) {
        if (level <= 6) return 15;
        if (level > 15) return 5;
        return 20 - level;
    }
}

function cheesyWordGetter() {
    this.words = [window.i18n.__("cheer_up_1"), window.i18n.__("cheer_up_2"), window.i18n.__("cheer_up_3"), window.i18n.__("cheer_up_4"), window.i18n.__("cheer_up_5"), window.i18n.__("cheer_up_6")];

    this.getWord = function () {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }
}
// 定义游戏
function Game() {
    var self = this;

    // Local game state variables
    this.currentClicks = 0;
    this.bestLevel = 1;
    this.clicksForBest = 0;
    this.totalClicks = 0;
    this.level = 1;
    this.isFirstGame = 1;

    // Objects that help facilitate the game
    this.gb;
    this.sh = new styleHelper();
    this.cookh = new cookieHelper();
    this.cwg = new cheesyWordGetter();

    this.processClick = function (w, h) {
        this.gb.processClick(w, h);
        this.currentClicks++;
        this.totalClicks++;
        this.updateCounts();
        if (this.gb.isGameWin()) {
            this.gameEnd(function () {
                self.cookh.writeCookie(self);
            });
        } else {
            self.cookh.writeCookie(self);
        }
    }

    this.processMouseover = function (w, h) {
        this.gb.processMouseover(w, h);
    }

    this.processMouseout = function (w, h) {
        this.gb.processMouseout(w, h);
    }

// 开始游戏
    this.beginGame = function () {
        var res;
        this.cookh.readCookie(function (csv) {
            res = csv;
            if (res != "") {
              // 初始化参数
                var state = res.split(" ");
                self.currentClicks = parseInt(state[0]);
                self.bestLevel = parseInt(state[1]);
                self.clicksForBest = parseInt(state[2]);
                self.totalClicks = parseInt(state[3]);
                self.level = parseInt(state[4]);
                self.isFirstGame = parseInt(state[5]);
            }
            // 首次游戏？
            if (self.isFirstGame == 1) {
                window.showMessage(window.i18n.__("instruct"), window.i18n.__("instruct_details"), null, null);
                self.isFirstGame = 0;
            }
            self.setupLevel();
        });

    }

    this.gameEnd = function (callback) {
        this.level++;
        if (this.level == this.bestLevel && this.currentClicks < this.clicksForBest) {
            this.clicksForBest = this.currentClicks;
        }
        if (this.level > this.bestLevel) {
            this.clicksForBest = this.currentClicks;
            this.bestLevel = this.level;
        }
        this.resetGame();
        callback();
    }

    this.resetGame = function () {
        $('#cheesyGoodJob').html(this.cwg.getWord() + "!");
        $('#levelDescriptor').html("进入级别 " + this.level);
        setTimeout(function () {
            $('#newLevel').modal('show');
            self.setupLevel();
        }, 500);
        setTimeout(function () {
            $('#newLevel').modal('hide');
        }, 1500);
    }

// 提级
    this.setupLevel = function () {
        this.gb = new GameBoard(this.level, this.level);
        $('.board').html("");
        this.gb.populate();
        self.gb.renderBoard();
        self.sh.setGridSize(this.level);
        self.updateCounts();
        self.applyBindings();
    }

    this.updateCounts = function () {
        $(".currLevel").html(window.i18n.__("current_level") + " : <b>" + this.level + "</b>");
        $(".score").html(window.i18n.__("current_click_counts") + " : <b>" + this.currentClicks + "</b>");
        $(".best").html(window.i18n.__("best_ever_level") + " : <b>" + this.bestLevel + "</b> (" + this.clicksForBest + " clicks)");
        $(".total").html(window.i18n.__("total_click_counts") + " : <b>" + this.totalClicks + "</b>");
    }

// 事件绑定
    this.applyBindings = function () {
        var flag = IsPC();
        if(flag){
              // PC事件
              $('.gamesquare').click(function () {
                  var corrd = self.getCorrd(this);
                  self.processClick(corrd.x, corrd.y);
              });
              $('.gamesquare').mouseover(function () {
                  var corrd = self.getCorrd(this);
                  self.processMouseover(corrd.x, corrd.y);
              });
              $('.gamesquare').mouseout(function () {
                  var corrd = self.getCorrd(this);
                  self.processMouseout(corrd.x, corrd.y);
              });
         }else {
          // 手机事件
          /*
           * touchstart：触摸开始的时候触发
           * touchmove：手指在屏幕上滑动的时候触发
           * touchend：触摸结束的时候触发
           */
           $('.gamesquare').on('touchstart',function () {
                var corrd = self.getCorrd(this);
                self.processClick(corrd.x, corrd.y);
                self.processMouseover(corrd.x, corrd.y);
           });
           $('.gamesquare').on('touchmove',function () {
                var corrd = self.getCorrd(this);
                self.processMouseover(corrd.x, corrd.y);
           });
           $('.gamesquare').on('touchend',function () {
                var corrd = self.getCorrd(this);
                self.processMouseout(corrd.x, corrd.y);
           });
      }
    }

    this.onNewGameClick = function () {
        this.currentClicks = 0;
        this.level = 1;
        this.setupLevel();
    }

    this.onResetLevelClick = function () {
        this.gb.populate();
        this.gb.renderBoard();
        this.setupLevel();
    }

    this.getCorrd = function (context) {
        var cname = $(context).context.className.split(" ")[1];
        var coord = cname.substring(5).split("q");
        var height = parseInt(coord[1]);
        var width = parseInt(coord[0]);
        return {x: width, y: height};
    }
}

function GameBoard(wd, hi) {
    // wide and high are 0 indexed
    this.high = hi - 1;
    this.wide = wd - 1;

    this.count = 0;

    this.shake_css = "shake shake-slow shake_hover shake-slow_hover";

    // This board is accessed wide first then high
    //    0 | 1 | 2 | 3 | ....
    //  - - - - - - - - - - - -
    //  0   |   |   |   |
    //  - - - - - - - - - - - -
    //  1   |   |[2][1]
    //  -
    //  2
    //  :
    //  :
    //
    this.board = new Array(wd);
    for (var i = 0; i <= this.wide; i++) {
        this.board[i] = new Array(hi);
    }

    this.renderBoard = function () {
        var s = "";
        for (var j = 0; j <= this.high; j++) {
            s += "<div class='gamerow'>";
            for (var i = 0; i <= this.wide; i++) {
                s += "<div class='gamesquare coord" + i + "q" + j + "'></div>";
                // console.log(this.board[i][j]);
            }
            s += "</div>";
        }
        $('.board').html(s);


        for (var i = 0; i <= this.wide; i++) {
            for (var j = 0; j <= this.high; j++) {
                this.processCLickView(i, j);
            }
        }
    }

    function getFixedXY(x, y) {
        var lowx = x - 1;
        var highx = x + 1;
        var lowy = y - 1;
        var highy = y + 1;

        // Test for edge cases and change the bounds accordingly
        if (x == 0) lowx = 0;
        if (x == this.wide) highx = this.wide;
        if (y == 0) lowy = 0;
        if (y == this.high) highy = this.high;
        return {lowx: lowx, highx: highx, lowy: lowy, highy: highy};
    }

    this.processClick = function (w, h) {
        // find the proper range for inversion
        var __ret = getFixedXY.call(this, w, h);
        var lowx = __ret.lowx;
        var highx = __ret.highx;
        var lowy = __ret.lowy;
        var highy = __ret.highy;
        // invert all in proper vertical range
        for (var i = lowy; i <= highy; i++) {
            // if (i == h) continue;
            if (this.board[w][i] == 0) {
                this.board[w][i] = 1;
                this.count++;
            } else {
                this.board[w][i] = 0;
                this.count--;
            }
            this.processCLickView(w, i);
        }

        // invert all in proper horizontal range
        for (var i = lowx; i <= highx; i++) {
            if (i == w) continue;
            if (this.board[i][h] == 0) {
                this.board[i][h] = 1;
                this.count++;
            } else {
                this.board[i][h] = 0;
                this.count--;
            }
            this.processCLickView(i, h);
        }
    }

    this.processMouseover = function (w, h) {
        var __ret = getFixedXY.call(this, w, h);
        var lowx = __ret.lowx;
        var highx = __ret.highx;
        var lowy = __ret.lowy;
        var highy = __ret.highy;
        // invert all in proper vertical range
        for (var i = lowy; i <= highy; i++) {
            this.processMouseoverView(w, i);
        }

        // invert all in proper horizontal range
        for (var i = lowx; i <= highx; i++) {
            if (i == w) continue;
            this.processMouseoverView(i, h);
        }
    }

    this.processMouseout = function (w, h) {
        var __ret = getFixedXY.call(this, w, h);
        var lowx = __ret.lowx;
        var highx = __ret.highx;
        var lowy = __ret.lowy;
        var highy = __ret.highy;
        // invert all in proper vertical range
        for (var i = lowy; i <= highy; i++) {
            this.processMouseoutView(w, i);
        }

        // invert all in proper horizontal range
        for (var i = lowx; i <= highx; i++) {
            if (i == w) continue;
            this.processMouseoutView(i, h);
        }
    }

    // For a single tile finds the corresponding DOM element
    // and inverts the color
    this.processCLickView = function (w, h) {
        var coord = ".coord" + w + "q" + h;
        // console.log(coord);
        if (this.board[w][h] == 0) {
            $(coord).css("background-color", "#E6AB5E");
        } else {
            $(coord).css("background-color", "#5C90FF");
        }
    }

    this.processMouseoverView = function (w, h) {
        var coord = ".coord" + w + "q" + h;
        $(coord).addClass(this.shake_css);
    }

    this.processMouseoutView = function (w, h) {
        var coord = ".coord" + w + "q" + h;
        $(coord).removeClass(this.shake_css);
    }

    // Populate the game board with 0s and 1s randomly
    this.populate = function () {
        for (var i = 0; i <= this.wide; i++) {
            for (var j = 0; j <= this.high; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    this.isGameWin = function () {
        return this.count == (this.wide + 1) * (this.high + 1);
    }

    /*this.parseGameBoard = function(csv, callback) {
     var res = csv.split(",");
     //console.log(res.length);
     for (var i = 0; i < res.length; i++) {
     console.log(Math.floor(i/(this.high+1)) + "," + i % (this.high+1));
     this.board[Math.floor(i / (this.high+1))][i % (this.high+1)] = parseInt(res[i]);
     }
     callback();
     }*/
}
