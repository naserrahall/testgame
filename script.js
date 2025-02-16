let selectedCategories = [];
  let team1Score = 0;
  let team2Score = 0;
  let currentTeam = "team1";
  let timer;
  let timeRemaining = 30;
  let pausedTimeRemaining = 0;
  let questionActive = false;
  let currentQuestionElement;
  let team1Name, team2Name;
  let totalQuestions = 28;
  let answerShown = false;
  let allowSecondTeamToAnswer = false;
  let team1TurnAnswers = 0;
  let team2TurnAnswers = 0;
  let team1OutOfTurnAnswers = 0;
  let team2OutOfTurnAnswers = 0;
  let noAnswerCount = 0;
  let currentAnswer = ""; // Stores the current answer to display when "Show Answer" is clicked
  let lastQuestionAnswered = false; // Flag to track if the last question has been answered


  let team1ChangeQuestionCount = 2;
  let team2ChangeQuestionCount = 2;
  let team1ShowOptionsCount = 2;
  let team2ShowOptionsCount = 2;

  let usedQuestions = {}; // Object to track used questions by category and difficulty


  // Stores displayed questions to avoid repeats
  let displayedQuestions = {};

  // Questions for each category and difficulty level
  let questions = null;
  fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    questions = data;
  })
  .catch(error => console.error('Error loading JSON:', error));

  function updateRemainingAttemptsDisplay() {
    document.getElementById("team1ChangeAttempts").innerText = team1ChangeQuestionCount;
    document.getElementById("team1ShowAttempts").innerText = team1ShowOptionsCount;
    document.getElementById("team2ChangeAttempts").innerText = team2ChangeQuestionCount;
    document.getElementById("team2ShowAttempts").innerText = team2ShowOptionsCount;
}

  function enableStartButton() {
    const team1 = document.getElementById('team1').value.trim();
    const team2 = document.getElementById('team2').value.trim();
    document.getElementById('startGameButton').disabled = team1 === "" || team2 === "" || selectedCategories.length < 4;
  }

  function selectCategory(element) {
    if (selectedCategories.includes(element.innerText)) {
      element.classList.remove('selected');
      selectedCategories = selectedCategories.filter(c => c !== element.innerText);
    } else if (selectedCategories.length < 4) {
      element.classList.add('selected');
      selectedCategories.push(element.innerText);
    }
    enableStartButton();
  }

  function startGame() {
    team1Name = document.getElementById('team1').value;
    team2Name = document.getElementById('team2').value;
    document.getElementById("team1Score").innerText = `${team1Name}: ${team1Score}`;
    document.getElementById("team2Score").innerText = `${team2Name}: ${team2Score}`;
    document.querySelector(".team-section").style.display = "none";
    document.querySelector(".category-section").style.display = "none";
    document.getElementById("gameBoard").style.display = "block";
    displayCategories();
    updateTurnIndicator();
    resetDisplayedQuestions(); // Reset displayed questions tracking for a new game
    updateRemainingQuestions();

  }

  function resetDisplayedQuestions() {
    displayedQuestions = {}; // Clear the displayed questions for a fresh game
  }

  function displayCategories() {
    const selectedCategoriesDiv = document.getElementById("selectedCategories");
    selectedCategoriesDiv.innerHTML = "";
    selectedCategories.forEach(category => {
      let column = document.createElement('div');
      column.classList.add('question-column');
      column.innerHTML = `<div><strong>${category}</strong></div>`;
      [200, 200, 400, 400, 600, 600, 1000].forEach(points => {
        let questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.setAttribute('data-points', points);
        questionDiv.setAttribute('data-category', category);
        questionDiv.setAttribute('onclick', 'selectQuestion(this)');
        questionDiv.innerText = `${points} نقطة`;
        column.appendChild(questionDiv);
      });
      selectedCategoriesDiv.appendChild(column);
    });
  }

  function selectQuestion(element) {
    if (questionActive || element.classList.contains('answered')) return;

    questionActive = true;
    allowSecondTeamToAnswer = false;
    currentQuestionElement = element;
    element.classList.add('answered');
    lastQuestionAnswered = false;

    const category = element.getAttribute('data-category');
    const points = parseInt(element.getAttribute('data-points'));
    const difficulty = getDifficulty(points);

    displayQuestion(category, difficulty, points); // Pass points as an argument
    totalQuestions--;
    updateRemainingQuestions(); // Update the remaining questions counter

    // Check if it's the last question
    if (totalQuestions === 0 && lastQuestionAnswered) {
      setTimeout(endGame, 1000); // End game if last question and one response button was clicked
    } else {
      resetPauseResumeButton();
      startTimer();
    }
}

  function getDifficulty(points) {
    switch (points) {
      case 200:
        return "easy";
      case 400:
        return "medium";
      case 600:
        return "hard";
      case 1000:
        return "impossible";
    }
  }

  function displayQuestion(category, difficulty, points) {
    const questionDisplay = document.getElementById('questionDisplay');
    const randomQuestionObj = getRandomQuestion(category, difficulty);
    const randomQuestionText = randomQuestionObj.question;
    currentAnswer = randomQuestionObj.answer; // Store the answer for "Show Answer" button
    currentOptions = randomQuestionObj.options; // Store the options for "Show Options" button

    questionDisplay.style.display = "block";
    questionDisplay.innerHTML = `
        <div style="font-size: 24px; font-weight: bold;">${category} - ${difficulty} Difficulty</div>
        <div id="questionText" style="font-size: 20px; margin-top: 10px;">${randomQuestionText}</div>
        <button onclick="toggleAnswer()">اعرض الاجابة</button>
        <button id="changequestionbutton" onclick="changeQuestion('${category}', '${difficulty}')">تغيير السؤال</button>
        <button id="showoptionsbutton" onclick="showOptions()">عرض الخيارات</button>
        <div id="answer" style="display:none; font-size: 18px; margin-top: 10px;">${currentAnswer}</div>
        <div id="options" style="display:none; font-size: 18px; margin-top: 10px;"></div>
        <button id="correctButton" onclick="answerQuestion(true, ${points})">صحيح</button>
        <button id="noAnswerButton" style="display:none" onclick="noAnswer()">لم يجاوب احد</button>
        <button id="otherTeamAnswerButton" style="display:none" onclick="otherTeamAnswer(${points})">الفريق الاخر اجاب</button>`;
}

function showOptions() {
      // Check if the current team has any "Show Options" chances left
      if ((currentTeam === "team1" && team1ShowOptionsCount <= 0) ||
        (currentTeam === "team2" && team2ShowOptionsCount <= 0)) {
        alert("No more chances to show options for this team.");
        return;
    }

    // Decrement the counter for the current team
    if (currentTeam === "team1") {
        team1ShowOptionsCount--;
    } else {
        team2ShowOptionsCount--;
    }

    // Update the display of remaining attempts
    updateRemainingAttemptsDisplay();

    const optionsDisplay = document.getElementById("options");
    if (optionsDisplay.style.display === "none") {
        // Show the options if they're hidden
        optionsDisplay.style.display = "block";
        optionsDisplay.innerHTML = currentOptions.map((option, index) => `<div>${String.fromCharCode(65 + index)}. ${option}</div>`).join("");
    } else {
        // Hide the options if they're already displayed
        optionsDisplay.style.display = "none";
    }
}
function resetCounters() {
    team1ChangeQuestionCount = 2;
    team2ChangeQuestionCount = 2;
    team1ShowOptionsCount = 2;
    team2ShowOptionsCount = 2;
    updateRemainingAttemptsDisplay();

}

function getRandomQuestion(category, difficulty) {
    // Initialize the tracker for the category and difficulty if it doesn't exist
    if (!usedQuestions[category]) {
        usedQuestions[category] = { easy: [], medium: [], hard: [], impossible: [] };
    }

    // Get all questions for the given category and difficulty
    const allQuestions = questions[category][difficulty];

    // Filter out questions that have already been used
    const availableQuestions = allQuestions.filter(
        question => !usedQuestions[category][difficulty].includes(question.question)
    );

    if (availableQuestions.length === 0) {
        alert("No more available questions for this category and difficulty.");
        return null; // Return null if no questions are available
    }

    // Select a random question from the available pool
    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    // Mark the question as used
    usedQuestions[category][difficulty].push(randomQuestion.question);

    return randomQuestion;
}


function changeQuestion(category, difficulty) {
    // Check if the current team has any "Change Question" chances left
    if ((currentTeam === "team1" && team1ChangeQuestionCount <= 0) ||
        (currentTeam === "team2" && team2ChangeQuestionCount <= 0)) {
        alert("No more chances to change the question for this team.");
        return;
    }

    // Decrement the counter for the current team
    if (currentTeam === "team1") {
        team1ChangeQuestionCount--;
    } else {
        team2ChangeQuestionCount--;
    }

  

    updateRemainingAttemptsDisplay();


    const newQuestionObj = getRandomQuestion(category, difficulty);
    if (!newQuestionObj) {
        return; // Exit if no questions are available
    }
    const newQuestionText = newQuestionObj.question;
    currentAnswer = newQuestionObj.answer; // Update the current answer
    currentOptions = newQuestionObj.options; // Update the current options

    // Update only the question text and answer text without refreshing other elements
    document.getElementById("questionText").innerText = newQuestionText;
    document.getElementById("answer").innerText = currentAnswer; // Set the new answer text

    // Hide the answer if it was shown and reset the answer display and toggle state
    document.getElementById("answer").style.display = "none";
    document.getElementById("options").style.display = "none"; // Hide options display when question changes
    answerShown = false;
    document.querySelector('button[onclick="toggleAnswer()"]').innerText = "اظهار الاجابة"; // Reset button text
}

function resetUsedQuestions() {
    usedQuestions = {}; // Clear the tracker
}


function toggleAnswer() {
    answerShown = !answerShown;
    document.getElementById("answer").style.display = answerShown ? "block" : "none";
    document.querySelector('button[onclick="toggleAnswer()"]').innerText = answerShown ? "اخفاء الاجابة" : "اظهار الاجابة";
}


  function resetPauseResumeButton() {
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    pauseResumeButton.style.display = "inline";
    pauseResumeButton.innerText = "ايقاف المؤقت";
  }

  function togglePauseResume() {
    const pauseResumeButton = document.getElementById("pauseResumeButton");
    if (pauseResumeButton.innerText === "ايقاف المؤقت") {
      clearInterval(timer);
      pausedTimeRemaining = timeRemaining;
      document.getElementById("showoptionsbutton").style.display = "none";
      document.getElementById("changequestionbutton").style.display = "none";
      document.getElementById("correctButton").style.display = "none";
      document.getElementById("noAnswerButton").style.display = "inline";
      document.getElementById("otherTeamAnswerButton").style.display = "inline";
      pauseResumeButton.innerText = "استئناف الوقت";
    } else {
      document.getElementById("showoptionsbutton").style.display = "inline";
      document.getElementById("changequestionbutton").style.display = "inline";
      document.getElementById("correctButton").style.display = "inline";
      document.getElementById("noAnswerButton").style.display = "none";
      document.getElementById("otherTeamAnswerButton").style.display = "none";
      resumeTimer();
      pauseResumeButton.innerText = "ايقاف المؤقت";
    }
  }

  function startTimer() {
    clearInterval(timer);
    timeRemaining = 30;
    document.getElementById("timer").innerText = timeRemaining;

    timer = setInterval(() => {
      timeRemaining--;
      document.getElementById("timer").innerText = timeRemaining;
      if (timeRemaining <= 0) {
        clearInterval(timer);
        allowSecondTeamToAnswer = true;
        document.getElementById("pauseResumeButton").style.display = "none"; // Hide pause button at end of time
        document.getElementById("correctButton").style.display = "none";
        document.getElementById("noAnswerButton").style.display = "inline";
        document.getElementById("otherTeamAnswerButton").style.display = "inline";
        document.getElementById("showoptionsbutton").style.display = "none";
        document.getElementById("changequestionbutton").style.display = "none";
        alert(`Time's up! Now ${currentTeam === 'team1' ? team2Name : team1Name} can answer.`);
      }
    }, 1000);
  }

  function resumeTimer() {
    clearInterval(timer);
    timeRemaining = pausedTimeRemaining;
    timer = setInterval(() => {
      timeRemaining--;
      document.getElementById("timer").innerText = timeRemaining;
      if (timeRemaining <= 0) {
        clearInterval(timer);
        allowSecondTeamToAnswer = true;
        document.getElementById("pauseResumeButton").style.display = "none"; // Hide pause button at end of time
        document.getElementById("correctButton").style.display = "none";
        document.getElementById("noAnswerButton").style.display = "inline";
        document.getElementById("otherTeamAnswerButton").style.display = "inline";
        document.getElementById("showoptionsbutton").style.display = "none";
        document.getElementById("changequestionbutton").style.display = "none";

        alert(`Time's up! Now ${currentTeam === 'team1' ? team2Name : team1Name} can answer.`);
      }
    }, 1000);
  }

  function answerQuestion(isCorrect, points) {
    clearInterval(timer);
    if (isCorrect) {
        if (currentTeam === 'team1') {
            team1Score += points;
            team1TurnAnswers++;
        } else {
            team2Score += points;
            team2TurnAnswers++;
        }
    }
    updateScores();
    questionActive = false;
    currentQuestionElement = null;
    lastQuestionAnswered = true; // Mark that the last question was answered
    document.getElementById('questionDisplay').style.display = "none";
    document.getElementById("pauseResumeButton").style.display = "none";

    if (totalQuestions === 0) {
        setTimeout(endGame, 1000); // End game if last question
    } else {
        switchTeam();
    }
    document.getElementById("timer").innerText = 30;

}

function noAnswer() {
    clearInterval(timer);
    noAnswerCount++;
    questionActive = false;
    currentQuestionElement = null;
    lastQuestionAnswered = true; // Mark that the last question was answered
    document.getElementById('questionDisplay').style.display = "none";
    document.getElementById("pauseResumeButton").style.display = "none";

    if (totalQuestions === 0) {
        setTimeout(endGame, 1000); // End game if last question
    } else {
        switchTeam();
    }
    document.getElementById("timer").innerText = 30;

}


function otherTeamAnswer(points) {
    if (!allowSecondTeamToAnswer && document.getElementById("pauseResumeButton").innerText !== "استئناف الوقت") return;

    clearInterval(timer);
    let otherTeam = currentTeam === 'team1' ? 'team2' : 'team1';
    if (otherTeam === 'team1') {
        team1Score += points;
        team1OutOfTurnAnswers++;
    } else {
        team2Score += points;
        team2OutOfTurnAnswers++;
    }
    updateScores();
    questionActive = false;
    allowSecondTeamToAnswer = false;
    currentTeam = otherTeam;
    lastQuestionAnswered = true; // Mark that the last question was answered
    document.getElementById('questionDisplay').style.display = "none";
    document.getElementById("pauseResumeButton").style.display = "none";

    if (totalQuestions === 0) {
        setTimeout(endGame, 1000); // End game if last question
    } else {
        updateTurnIndicator();
        alert(`${currentTeam === 'team1' ? team1Name : team2Name}'s turn!`);
      }
    document.getElementById("timer").innerText = 30;

}

  function updateScores() {
    document.getElementById("team1Score").innerText = `${team1Name}: ${team1Score}`;
    document.getElementById("team2Score").innerText = `${team2Name}: ${team2Score}`;
  }

  function switchTeam() {
    currentTeam = currentTeam === 'team1' ? 'team2' : 'team1';
    updateTurnIndicator();
    alert(`${currentTeam === 'team1' ? team1Name : team2Name}'s turn!`);
  }

  function updateTurnIndicator() {
    document.getElementById('turnIndicator').innerText = `الدور الحالي لـ:  ${currentTeam === 'team1' ? team1Name : team2Name}`;
  }

  function updateRemainingQuestions() {
    document.getElementById("remainingQuestions").innerText = `الاسئلة المتبقية:  ${totalQuestions}`;
}

// Function to end the game
function endGame() {
    document.getElementById("gameBoard").style.display = "none";
    document.getElementById("resultPage").style.display = "block";
    displayMatchDetails();
}

  function displayMatchDetails() {
    const pointDifference = Math.abs(team1Score - team2Score);
    const winningTeam = team1Score > team2Score ? team1Name : team2Score > team1Score ? team2Name : "It's a Tie!";
    const scoreDisplay = `${team1Name} ${team1Score} - ${team2Score} ${team2Name}`;

    document.getElementById("winningTeam").innerText = winningTeam !== "It's a Tie!" ? `${winningTeam} Wins!` : "It's a Tie!";
    document.getElementById("finalScore").innerText = scoreDisplay;
    const resultHTML = `
      <p><strong>Point Difference:</strong> ${pointDifference}</p>
      <p><strong>${team1Name} Questions Answered in Turn:</strong> ${team1TurnAnswers}</p>
      <p><strong>${team2Name} Questions Answered in Turn:</strong> ${team2TurnAnswers}</p>
      <p><strong>${team1Name} Questions Answered Out of Turn:</strong> ${team1OutOfTurnAnswers}</p>
      <p><strong>${team2Name} Questions Answered Out of Turn:</strong> ${team2OutOfTurnAnswers}</p>
      <p><strong>Questions No One Answered:</strong> ${noAnswerCount}</p>
    `;
    document.getElementById("matchDetails").innerHTML = resultHTML;
  }

  function restartGame() {
    resetUsedQuestions();
    resetCounters();
    resetDisplayedQuestions();
    clearInterval(timer); // Stop the timer if the user restarts the game

    totalQuestions = 28;
    questionActive = false;
    currentQuestionElement = null;
    team1Score = 0;
    team2Score = 0;
    team1TurnAnswers = 0;
    team2TurnAnswers = 0;
    team1OutOfTurnAnswers = 0;
    team2OutOfTurnAnswers = 0;
    noAnswerCount = 0;
    timeRemaining = 30;
    pausedTimeRemaining = 0;
    updateScores();
    displayCategories();
    updateTurnIndicator();
    updateRemainingQuestions();

    document.getElementById("timer").innerText = timeRemaining;
    document.getElementById("questionDisplay").style.display = "none";
    document.getElementById("pauseResumeButton").style.display = "none";
    document.getElementById("resultPage").style.display = "none";
    document.getElementById("gameBoard").style.display = "block";
  }

  function backToSelectCategories() {
    location.reload(); // Reload the page to go back to the first page
  }

  document.getElementById('team1').addEventListener('input', enableStartButton);
  document.getElementById('team2').addEventListener('input', enableStartButton);
