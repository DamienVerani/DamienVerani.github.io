var touchstone = 2;

var state = {
  NONE:0,
  INSTRUCTIONS: 1,
  SHAPES: 2,
  PLACEHOLDERS: 3,
};

var ctx = {
  w: 800,
  h: 600,

  trials: [],
  participant: "",
  startBlock: 0,
  startTrial: 0,
  cpt: 0,

  participantIndex:touchstone == 1 ? "Participant" : "ParticipantID",
  practiceIndex:"Practice",
  blockIndex: (touchstone == 1 ? "Block" : "Block1"),
  trialIndex: (touchstone == 1 ? "Trial" : "TrialID"),
  vvIndex:"VV",
  objectsCountIndex:"OC",

  state:state.NONE,
  targetIndex:0,
  objectsList: [],
  currentTrial: 0,
  startTime: 0,
  reactionTime: 0,
  errorCount: 0,

  // TODO log measures
  // loggedTrials is a 2-dimensional array where we store our log file
  // where one line is one trial
  loggedTrials:
    touchstone == 1 ?
    [["Participant","Practice","Block","Trial","VV","OC","visualSearchTime","ErrorCount"]] :
    [["DesignName","ParticipantID","TrialID","Block1","Block2","VV","OC","visualSearchTime","ErrorCount"]]
};

/****************************************/
/********** LOAD CSV DESIGN FILE ********/
/****************************************/

var loadData = function(svgEl){
  // d3.csv parses a csv file...
  d3.csv("experiment_touchstone"+touchstone+".csv").then(function(data){
    // ... and turns it into a 2-dimensional array where each line is an array indexed by the column headers
    // for example, data[2]["OC"] returns the value of OC in the 3rd line
    ctx.trials = data;
	console.log(data);
    // all trials for the whole experiment are stored in global variable ctx.trials

    var participant = "";
    var options = [];

    for(var i = 0; i < ctx.trials.length; i++) {
      if(!(ctx.trials[i][ctx.participantIndex] === participant)) {
        participant = ctx.trials[i][ctx.participantIndex];
        options.push(participant);
      }
    }

    var select = d3.select("#participantSel")
    select.selectAll("option")
      .data(options)
      .enter()
      .append("option")
      .text(function (d) { return d; });

    setParticipant(options[0]);

  }).catch(function(error){console.log(error)});
};

/****************************************/
/************* RUN EXPERIMENT ***********/
/****************************************/


var startExperiment = function(event) {
  event.preventDefault();
  d3.select("#end").remove();

  // set the trial counter to the first trial to run
  // ctx.participant, ctx.startBlock and ctx.startTrial contain values selected in combo boxes

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock
               && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex] === "false")) {
        if(parseInt(ctx.trials[i][ctx.trialIndex]) == ctx.startTrial) {
          ctx.cpt = i - 1;

          if(touchstone == 1) { // include practice trials before this trial for TouchStone 1
            while(ctx.cpt >= 0 && ctx.trials[ctx.cpt][ctx.practiceIndex] === "true") {
              ctx.cpt = ctx.cpt-1;
            }
          }

          // start first trial
          console.log("start experiment at "+ctx.cpt);
		  ctx.currentTrial = 0;
          nextTrial();
          return;
        }
      }
    }
  }

}

var nextTrial = function() {
  ctx.cpt++;
  ctx.currentTrial++;
  ctx.errorCount = 0;
  displayInstructions();
}

var displayInstructions = function() {
  ctx.state = state.INSTRUCTIONS;

  d3.select("#instr")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);

  d3.select("#instructions")
    .append("p")
    .html("Multiple shapes will get displayed.<br> Only <b>one shape</b> is different from all other shapes.");

  d3.select("#instructions")
    .append("p")
    .html("1. Spot it as fast as possible and press <code>Space</code> bar;");

  d3.select("#instructions")
    .append("p")
    .html("2. Click on the placeholder over that shape.");

  d3.select("#instructions")
    .append("p")
    .html("Press <code>Enter</code> key when ready to start.");
	
  d3.select("#instructions")
    .append("p")
    .html("You are now on the trial "+ ctx.currentTrial+"/45");

}

var displayShapes = function() {
  ctx.state = state.SHAPES;

  var visualVariable = ctx.trials[ctx.cpt]["VV"];
  var oc = ctx.trials[ctx.cpt]["OC"];
  if(oc === "Low") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }
  console.log("display shapes for condition "+oc+","+visualVariable);

  var svgElement = d3.select("svg");
  var group = svgElement.append("g")
  .attr("id", "shapes")
  .attr("transform", "translate(100,100)");

  // 1. Decide on the visual appearance of the target
  // In my example, it means deciding on its orientation (straight or inclined) and its curvature (curved or not)
  var randomNumber1 = Math.random();
  var randomNumber2 = Math.random();
  
  var targetOrientation = 30, targetCurvature = 0;
  if(visualVariable == "Orientation" || visualVariable == "Orientation_Curved_straight"){
	  if(randomNumber1 > 0.5) {
		targetOrientation = 5; // target is inclined
	  } else {
		targetOrientation = 30; // target is straight
	  }
  }
  if(visualVariable == "Curved_straight" || visualVariable == "Orientation_Curved_straight"){
	  if(randomNumber2 > 0.5) {
		targetCurvature = 0; // target is straight
	  } else {
		targetCurvature = 25; // target is curved
	  }
  }
  
  // 2. Set the visual appearance of all other objects now that the target appearance is decided
  /*If we are testing VV1 and VV2 combined, the target can be straight and not curved, straight and curved, inclined and not curved
  or inclined and curved. Distractors can be any combination of VV1 and VV2 while this one is different of the target's one.*/
  var objectsAppearance = [];
  var first = 0;
  
  if(visualVariable == "Orientation_Curved_straight"){
    first = 6;
	if(targetOrientation != 30 || targetCurvature != 0) {
	  objectsAppearance.push({orientation: 30, curvature: 0});
	  objectsAppearance.push({orientation: 30, curvature: 0});
	}
	if(targetOrientation != 30 || targetCurvature != 25) {
	  objectsAppearance.push({orientation: 30, curvature: 25});
	  objectsAppearance.push({orientation: 30, curvature: 25});
	}
	if(targetOrientation != 5 || targetCurvature != 0) {
	  objectsAppearance.push({orientation: 5, curvature: 0});
	  objectsAppearance.push({orientation: 5, curvature: 0});
	}
	if(targetOrientation != 5 || targetCurvature != 25) {
	  objectsAppearance.push({orientation: 5, curvature: 25});
	  objectsAppearance.push({orientation: 5, curvature: 25});
	}
	console.log(objectsAppearance);
  }

  
  //If the user didn't make an error during the last trial, we create and display the next trial, otherwise we want him to redo exactly the same trial.
  if(ctx.errorCount == 0){
	  for (var i = first; i < objectCount-1; i++) {
		/*Here, we implement the case VV1 = "Orientation" so all other objects are inclined(resp. straight) 
		if target is straight(resp. inclined) but have the same curvature as target.*/
		if(visualVariable == "Orientation"){
			if(targetOrientation == 5) {
			  objectsAppearance.push({
				orientation: 30,
				curvature: 0
			});
			} else {
			  objectsAppearance.push({
				orientation: 5,
				curvature: 0
			  });
			}
		}
		/*Here, we implement the case VV2 = "Curved/straight" so all other objects are curved(resp. straight) 
		if target is straight(resp. curved) but have the same orientation as target.*/
		else if(visualVariable == "Curved_straight"){
			if(targetCurvature == 25) {
			  objectsAppearance.push({
			  orientation: 30,
				curvature: 0
			  });
			} else {
			  objectsAppearance.push({
				orientation: 30,
				curvature: 25
			  });
			}
		}
		/*Here, we implement the case VV1 and VV2 combined so all other objects have a different combination of orientation
		and curvature than the target's combination.*/
		else if(visualVariable == "Orientation_Curved_straight"){
	        var nb = Math.floor(Math.random()*3);
			if(targetOrientation == 30 && targetCurvature == 0) {
			  if(nb == 0) objectsAppearance.push({orientation: 30, curvature: 25});
			  else if(nb == 1) objectsAppearance.push({orientation: 5, curvature: 0});
			  else objectsAppearance.push({orientation: 5, curvature: 25});
			}
			else if(targetOrientation == 30 && targetCurvature == 25) {
			  if(nb == 0) objectsAppearance.push({orientation: 30, curvature: 0});
			  else if(nb == 1) objectsAppearance.push({orientation: 5, curvature: 0});
			  else objectsAppearance.push({orientation: 5, curvature: 25});
			}
			else if(targetOrientation == 5 && targetCurvature == 0) {
			  if(nb == 0) objectsAppearance.push({orientation: 30, curvature: 25});
			  else if(nb == 1) objectsAppearance.push({orientation: 30, curvature: 0});
			  else objectsAppearance.push({orientation: 5, curvature: 25});
			}
			else {
			  if(nb == 0) objectsAppearance.push({orientation: 30, curvature: 0});
			  else if(nb == 1) objectsAppearance.push({orientation: 30, curvature: 25});
			  else objectsAppearance.push({orientation: 5, curvature: 0});
			}
		}
	  }

	  // 3. Shuffle the list of objects (useful when there are variations regarding both visual variable) and add the target at a specific index
	  shuffle(objectsAppearance);
	  // draw a random index for the target
	  ctx.targetIndex = Math.floor(Math.random()*objectCount);
	  // and insert it at this specific index
	  objectsAppearance.splice(ctx.targetIndex, 0, {orientation:targetOrientation, curvature:targetCurvature});
  } else {
	objectsAppearance = ctx.objectsList;
  }

  // 4. We create actual SVG shapes and lay them out as a grid
  // compute coordinates for laying out objects as a grid
  var gridCoords = gridCoordinates(objectCount, 60);
  // display all objects by adding actual SVG shapes
  var startPointX, endPointX, startPointY, endPointY;
  var curvatureX, curvatureY;
  for (var i = 0; i < objectCount; i++) {
	  startPointX = gridCoords[i].x+objectsAppearance[i].orientation;
	  endPointX = 60-(objectsAppearance[i].orientation*2);
	  startPointY = gridCoords[i].y+5;
	  endPointY = 50;
	  curvatureX = -objectsAppearance[i].curvature;
	  curvatureY = objectsAppearance[i].curvature;
	  if(objectsAppearance[i].orientation == 5 && objectsAppearance[i].curvature == 25){
		startPointX += 10; endPointX -= 15;
		startPointY += 5; endPointY -= 20;
		curvatureX = 0;
		curvatureY = 35;
	  }
	  else if(objectsAppearance[i].orientation == 30 && objectsAppearance[i].curvature == 25){
		startPointX += 5;
		startPointY += 8; endPointY -= 12;
		curvatureY = 18;
	  }
	  else if(objectsAppearance[i].orientation == 5){
		startPointX += 10; endPointX -= 15;
		startPointY += 10; endPointY -= 15;
	  }
	  
      group.append("path")
	  .attr("d", "M"+startPointX+" "+startPointY+" q "+curvatureX+" "+curvatureY+" "+endPointX+" "+endPointY)
	  .attr("stroke", "Gray")
	  .attr("stroke-width", 15)
	  .attr("fill", "none");
  }
  
  //We keep the shapes list of the current trial in case the user makes a mistake and has to repeat the same trial.
  ctx.objectsList = objectsAppearance;
}

var displayPlaceholders = function() {
  ctx.state = state.PLACEHOLDERS;

  var oc = ctx.trials[ctx.cpt]["OC"];
  var objectCount = 0;

  if(oc === "Low") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }

  var svgElement = d3.select("svg");
  var group = svgElement.append("g")
  .attr("id", "placeholders")
  .attr("transform", "translate(100,100)");

  var gridCoords = gridCoordinates(objectCount, 60);
  for (var i = 0; i < objectCount; i++) {
    var placeholder = group.append("rect")
        .attr("x", gridCoords[i].x)
        .attr("y", gridCoords[i].y)
        .attr("width", 56)
        .attr("height", 56)
        .attr("fill", "Gray");
		
	if(i == ctx.targetIndex) placeholder.attr("id", "target");

    placeholder.on("click",
        function() {
          /*If the user succeeds in finding the target, we write the results (with reaction time and number of errors) in the output csv, 
		  otherwise we count his number of error for the concerned trial and he makes it again until he succeeds.*/
		  d3.select("#placeholders").remove();
		  
		  if(d3.select(this).attr("id") == "target"){
			console.log("OUI, "+ctx.reactionTime+", "+ctx.errorCount);
			ctx.loggedTrials.push(
				["Preattention-experiment", ctx.trials[ctx.cpt]["ParticipantID"], ctx.trials[ctx.cpt]["TrialID"], ctx.trials[ctx.cpt]["Block1"], 
				ctx.trials[ctx.cpt]["Block2"],ctx.trials[ctx.cpt]["VV"], ctx.trials[ctx.cpt]["OC"], ctx.reactionTime, ctx.errorCount]
			);
			if(ctx.participant == ctx.trials[ctx.cpt+1]["ParticipantID"]) {
			  nextTrial();
			} else {
			  ctx.state = state.NONE;
			  
			  d3.select("#instr")
				.append("div")
				.attr("id", "end")
				.classed("instr", true);
				
			  d3.select("#end")
				.append("p")
				.html('You have complete the experiment! Thank you for your participation.');
				
			  d3.select("#end")
				.append("p")
				.html('Please click on "Download log file" button to download your results, and send them by email at falcoz91410@gmail.com.');
			}
		  } else {
			console.log("NON");
			ctx.errorCount++;
			displayInstructions();
		  }
        }
      );
  }
}

var keyListener = function(event) {
  event.preventDefault();

  if(ctx.state == state.INSTRUCTIONS && event.code == "Enter") {
    d3.select("#instructions").remove();
    displayShapes();
	ctx.startTime = Date.now();
  }

  if(ctx.state == state.SHAPES && event.code == "Space") {
    ctx.reactionTime = Date.now() - ctx.startTime;
	d3.select("#shapes").remove();
    displayPlaceholders();
  }

}

var downloadLogs = function(event) {
  event.preventDefault();
  var csvContent = "data:text/csv;charset=utf-8,";
  console.log("logged lines count: "+ctx.loggedTrials.length);
  ctx.loggedTrials.forEach(function(rowArray){
   var row = rowArray.join(",");
   csvContent += row + "\r\n";
   console.log(rowArray);
  });
  var encodedUri = encodeURI(csvContent);
  var downloadLink = d3.select("form")
  .append("a")
  .attr("href",encodedUri)
  .attr("download","logs_"+ctx.trials[ctx.cpt][ctx.participantIndex]+"_"+Date.now()+".csv")
  .text("logs_"+ctx.trials[ctx.cpt][ctx.participantIndex]+"_"+Date.now()+".csv");
}


// returns an array of coordinates for laying out objectCount objects as a grid with an equal number of lines and columns
function gridCoordinates(objectCount, cellSize) {
  var gridSide = Math.sqrt(objectCount);
  var coords = [];
  for (var i = 0; i < objectCount; i++) {
    coords.push({
      x:i%gridSide * cellSize,
      y:Math.floor(i/gridSide) * cellSize
    });
  }
  return coords;
}

// shuffle the elements in the array
// copied from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(array) {
  var j, x, i;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = array[i];
    array[i] = array[j];
    array[j] = x;
  }
  return array;
}

/*********************************************/

var createScene = function(){
  var svgEl = d3.select("#scene").append("svg");
  svgEl.attr("width", ctx.w);
  svgEl.attr("height", ctx.h)
  .classed("centered", true);

  loadData(svgEl);
};


/****************************************/
/******** STARTING PARAMETERS ***********/
/****************************************/

var setTrial = function(trialID) {
  ctx.startTrial = parseInt(trialID);
}

var setBlock = function(blockID) {
  ctx.startBlock = parseInt(blockID);

  var trial = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock) {
        if(!(ctx.trials[i][ctx.trialIndex] === trial)) {
          trial = ctx.trials[i][ctx.trialIndex];
          options.push(trial);
        }
      }
    }
  }

  var select = d3.select("#trialSel");

  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });

  setTrial(options[0]);

}

var setParticipant = function(participantID) {
  ctx.participant = participantID;

  var block = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(!(ctx.trials[i][ctx.blockIndex] === block)
          && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex] === "false")) {
        block = ctx.trials[i][ctx.blockIndex];
        options.push(block);
      }
    }
  }

  var select = d3.select("#blockSel")
  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });

  setBlock(options[0]);

};

function onchangeParticipant() {
  selectValue = d3.select("#participantSel").property("value");
  setParticipant(selectValue);
};

function onchangeBlock() {
  selectValue = d3.select("#blockSel").property("value");
  setBlock(selectValue);
};

function onchangeTrial() {
  selectValue = d3.select("#trialSel").property("value");
  setTrial(selectValue);
};
