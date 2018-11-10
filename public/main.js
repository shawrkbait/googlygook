$(function() {
  var socket = io();

  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $answerInput = $('.answerInput');
  var $loginPage = $('.login.page'); // The login page
  var $questionPage = $('.question.page');
  var $waitingPage = $('.waiting.page');
  var $scorePage = $('.scoreboard.page'); 
  var $scores = $('.scoreboardArea'); 
  var $currentInput = $usernameInput.focus();

  var username;
  var qlen;

  var curState = "question";

  $answerInput.val("");

  // Sets the client's username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $scorePage.show();
      $loginPage.off('click');

      // Tell the server your username
      socket.emit('add user', username);
    }
  }
  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }


  // Keyboard events

  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        if(curState == "question") {
          createAnswer();
        }
        else if(curState == "selectAnswer") {
          selectAnswer();
        }
      } else {
        setUsername();
      }
    }
  });

  const createAnswer = () => {
    var curVal = $answerInput.val();
    curVal = cleanInput(curVal.substring(qlen));
    console.log(curVal);
    socket.emit('create_answer', curVal);
    $questionPage.fadeOut();
    $waitingPage.show();
    $waitingPage.html("Waiting for everyone else");
    $questionPage.off('click');
  }

  const selectAnswer = () => {
    var curVal = $answerInput.val();
    curVal = cleanInput(curVal.substring(qlen));
    socket.emit('create_answer', curVal);
    $questionPage.fadeOut();
    $waitingPage.show();
    $waitingPage.html("Waiting for everyone else");
    $questionPage.off('click');
  }

  const updateScores = (users, options) => {
    var table = $("<table/>");
    var thead = $("<thead/>");
    var tr = $("<tr/>");
    var tbody = $("<tbody/>");
    tr.append($("<th/>").text("User"));
    tr.append($("<th/>").text("Score"));
    thead.append(tr);
    table.append(thead);
    $.each(users,function(rowIndex, r) {
        var row = $("<tr/>");
        row.append($("<td/>").text(users[rowIndex].username));
        row.append($("<td/>").text(users[rowIndex].score));
        tbody.append(row);
    });
    table.append(tbody);
    $scores.html(table);
    console.log(table);
  }

  const showQuestion = (data) => {
    console.log(data);

    var readOnlyLength = data.question.length;
    qlen = readOnlyLength;
    $answerInput.val(data.question);

    $answerInput.on('keypress, keydown', function(event) {
      var $field = $(this);
      if ((event.which != 37 && (event.which != 39))
        && ((this.selectionStart < readOnlyLength)
        || ((this.selectionStart == readOnlyLength) && (event.which == 8)))) {
        return false;
      }
    });
  }

  const showAnswers = (data) => {
    console.log(data);
    var table = $("<table/>");
    var tbody = $("<tbody/>");

    $answerInput.prop('readonly', true);
    $answerInput.val(data.question);
    $waitingPage.fadeOut();

    $.each(data.answers,function(rowIndex, r) {
        var row = $("<tr/>");
        row.append($("<td/>").text(data.question + data.answers[rowIndex]));

        row.on('click', function() {
          $answerInput.val(data.question + data.answers[rowIndex]);
        });
        tbody.append(row);
    });
    table.append(tbody);

    $('.question.page #answerSelection').html(table);

    $questionPage.show();
  }

  socket.on('login', (data) => {
    console.log("Welcome!");
  });
  
  socket.on('update state', (data) => {
    //updateScores(data.users);

    // Temporary
    socket.emit('start game', 'test');
  });

  socket.on('question', (data) => {
    curState = "question";

    $scorePage.hide();
    $currentInput = $answerInput.focus();
    showQuestion(data);
  });

  socket.on('select_answer', (data) => {
    curState = "selectAnswer";

    //$currentInput = $answerInput.focus();
    showAnswers(data);
  });

  socket.on('disconnect', () => {
    console.log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    console.log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    console.log('attempt to reconnect has failed');
  });

})