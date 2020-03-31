// developer:            horseshoenail
// Version:              1.1
// date of last version: 30.3.2020

/*  
This app acts as a pacemaker. You can set target distance and time
and it indicates wether you need to speed up or slow down. Its
accurate if GPS is used, otherwise it relies on the local distance
calculated by the device.

--- IMPORTANT NOTES ---
  - The app requires access to your heart rate sensor 
  - The app requires access to your activity data 
  - The app requires access to your GPS sensor 
  

--- GETTING STARTED ---

  -Start the app with or without a FITBIT device:
    A very good overview is given here: https://dev.fitbit.com/getting-started/

    In summary you need to do the following steps:
    - go to https://studio.fitbit.com and create an account
    - create a new empty project
    - download this project from git as zip
    - extract the zip locally 
    - mark all folders (app, companion, resources, settings) and drag and drop them into
      the left menu of the fitbit.studio development surface. All folders should now get 
      copied to your fitbit.studio development environment
    - for testing the app you now also need to install the “Fitbit OS simulator”.
      You can find it here: 
       - windows: https://simulator-updates.fitbit.com/download/latest/win
       - macOS: https://simulator-updates.fitbit.com/download/latest/mac
    - start the Fitbit OS simulator 
    - In fitbit.studio use the “select Phone” and “select device” menu to select the simulator
    - with the >Run button you can build and start the app, its now shown in the Simulator
    - if you want to run it on your own device:
      - on your phone open the fitbit app
        - select your Fitbit device you want to run it on
        - open the developer bridge menu and start the bridge
      - on your fitbit device:
        - go to settings 
        - start developer bridge
      - in fitbit.studio select your phone and your fitbit device in the select list
      - in fitbit.studio press >Run
      - the app is now getting installed on your device and starts. You can find it
        later in your normal app menu. 

--- FUNCTIONALITIES AND GENERAL DESCRIPTION ---

  The following functionalities are included.
  - Start screen
    - GPS Button: starts the search for a GPS signal
      - displays connected or no connection found depending on whether GPS is available
      - back button to get back to start screen
    
    - SET DISTANCE Button (red if no data were entered, white if a value was entered):
      - two toggler elements to set target distance with 0.1 km accuracy
      - back button to save entry and get back to start scree
    
    - SET TIME Button (red if no data were entered, white if a value was entered):
      - three toggler elements to set target time with 1 minute accuracy
      - back button to save entry and get back to start scree
      
    - START RUN Button (red if not all data were entered, white if all data are available):
      - three toggler elements to set target time with 1 minute accuracy
      
      - MAIN SCREEN:
        - you do: your current speed, either based on distance by steps or GPS
        - you should: the speed needed to reach the target distance in the desired target time
        - predicted time: time needed if you proceed with the current speed
        - slow down, speed up text and turtle or rabbit image if you are too slow or too fast
        - total distance in km
        - total time in hh:mm:ss
        - indicator whether steps or GPS was used as calculation method
      
        pyhsical button top right: switch between units (m/s, km/h, min/km)
        pyhsical button lower right: start stop excercise
        physical back button: 
          - if app is not running: back to start screen
          - if app is running toggle between views:
            - rabbit or turtle image, plus text, plus heartrate
            - your current speed and the speed you should do
            - your predicted time at arrival and the elapsed time plue heart rate
            - heart rate, distance and speed

*/


// import general packages and libraries needed
import document from "document";
import { me as appbit } from "appbit";
import { geolocation } from "geolocation";
import { today } from "user-activity"
import { HeartRateSensor } from "heart-rate";
import { me } from "appbit";
import { me as device } from "device";
import clock from "clock";
import * as util from "../resources/utils";
import exercise from "exercise";

///////////////////////////
// PERMISSIONS AND DEVICES 
///////////////////////////

me.appTimeoutEnabled = false;

if (device.modelName == "Ionic"){
  var screen_dimx = 348
  var screen_dimy = 250
}else{
  var screen_dimx = 300
  var screen_dimy = 300
}

// start heart rate monitoring
 if (HeartRateSensor && appbit.permissions.granted("access_heart_rate")) {
  var heart_rate = new HeartRateSensor();
  heart_rate.start();
}else{
  console.log('No heartrate sensor')
  class heart_rate_empty {
    constructor() {
      this.heartRate = 0;
    }
  }  
  var heart_rate = new heart_rate_empty()
}

//if (appbit.permissions.granted("access_activity")) {
//  var prevdist = today.local.distance;
//} else{var prevdist = 0} 
var prevdist = 0

///////////////////////////
// GLOBALS, STYLES AND SCREENS
///////////////////////////

// define the different screens used in the app
// start screen with four buttons: GPS, Set distance, set time and start run
var startScreen           = document.getElementById("startScreen");
// main view that contains all available features
var mainScreen            = document.getElementById("mainScreen");
// search for GPS connection
var GPSScreen             = document.getElementById("GPSScreen");
// set distance you want to run
var selectDistanceScreen  = document.getElementById("selectDistanceScreen");
// set time you want to achieve
var selectTimeScreen      = document.getElementById("selectTimeScreen");

// Buttons
var start_button          = document.getElementById("startButton"); 
var setDistance           = document.getElementById("setDistance"); 
var setTime               = document.getElementById("setTime"); 
var getGPS                = document.getElementById("getGPS"); 

// helper to switch between screens and to indicate which screen is displayed
var actually_showing      = "start_screen"
var main_screen_showing   = ""
// list needed to move through the different views with the back button
var mydisplay = ['all','rabbit_turtle','speed','eta','distance']
var mydisplay_index = 0


// labels, lines and tumblers used in the different screens 
var GPSScreen_label       = document.getElementById("GPSScreen_label"); 
var tumbler_hours_1    = document.getElementById("tumbler_hours_1");
var tumbler_minutes_1  = document.getElementById("tumbler_minutes_1");
var tumbler_minutes_2  = document.getElementById("tumbler_minutes_2");
var tumbler_km_1       = document.getElementById("tumbler_km_1");
var tumbler_km_2       = document.getElementById("tumbler_km_2");
var tumbler_km_3       = document.getElementById("tumbler_km_3");
var km_label           = document.getElementById("km_label");
var dot_label          = document.getElementById("dot_label");
var settime_label      = document.getElementById("settime_label");
var doubledot_label    = document.getElementById("doubledot_label");

// define images used in the app
var speed_up_slow_down_image = document.getElementById("speed_up_slow_down_image");
var play_pause_image = document.getElementById("play_pause_image");

// define general (fixed) layouts used in the app
var my_line1 = document.getElementById("my_line1");
var my_line2 = document.getElementById("my_line2");
var my_line3 = document.getElementById("my_line3");
var done_line1 = document.getElementById("done_line1");
var done_line2 = document.getElementById("done_line2");

// define interactive variables that change while the app is running
var youdo_label          = document.getElementById("youdo_label");
var youshould_label      = document.getElementById("youshould_label");
var pace_ms_label        = document.getElementById("pace_ms_label");
var pace_needed_ms_label = document.getElementById("pace_needed_ms_label");
var predicted_time_label = document.getElementById("predicted_time_label");
var eta_label            = document.getElementById("eta_label");
var text_part1_label     = document.getElementById("text_part1_label");
var text_part2_label     = document.getElementById("text_part2_label");
var distance_label       = document.getElementById("distance_label");
var time_elapsed_label   = document.getElementById("time_elapsed_label");
var hr_label             = document.getElementById("hr_label");
var stop_counting        = false
var seconds_stopped      = 0
var show_rabbit = false

// initialize time variables
var target_dist = 0.
var target_hour = 0.
var target_min  = 0.
var target_sec  = 0.
var target_time_in_s = 0.
var done = 0
var finaltime = 0

// setting up global vars
var isstarted = false
var s_hours = 0.
var s_mins  = 0.
var s_secs  = 0.
var lat_old = 0.
var lon_old = 0.
var GPS     = false
var calc_by_steps = false
var distance_update_step = 10
var exdist_old = 0

// global vars needed for the distance caluclations
const EarthRad_km = 6371.;
const m_per_km = 1000.;
var prevLat  = 0.;
var prevLng  = 0.;
var distance = 0.;
var total_distance = 0.;
var speed_ms = 0.;

var myunit = ['ms','kmh','minkm']
var myunit_index = 0


// for startup set all buttons to red. If target distance
// and target speed were added switch the color to white
setTime.style.fill     = "red";
setDistance.style.fill = "red";
start_button.style.fill = "red";

// hide tumbler elements as they are not needed on the start screen
tumbler_hours_1.style.display   = "none"
tumbler_minutes_1.style.display = "none"
tumbler_minutes_2.style.display = "none"
tumbler_km_1.style.display      = "none"
tumbler_km_2.style.display      = "none"
tumbler_km_3.style.display      = "none"


///////////////////////////
// HELPER FUNCTIONS
///////////////////////////

// set variables which are later defined by the setup screen
function set_reset_variables(){
  // setting up global vars
  isstarted = false
  s_hours = 0.
  s_mins  = 0.
  s_secs  = 0.
  lat_old = 0.
  lon_old = 0.
  prevLat  = 0.;
  prevLng  = 0.;
  distance = 0.;
  total_distance = 0.;
  speed_ms = 0.;
  GPS = false
  stop_counting = false
  seconds_stopped = 0
  //if (appbit.permissions.granted("access_activity")) {
  //  prevdist = today.local.distance;
  //} else{prevdist = 0} 

  if (exercise.state == "started") {
    prevdist = exercise.stats.distance
  }  
}


// get valules from the tumbler elements
function getTumblerText(myObject) {
 return myObject.getElementById("item" + myObject.value).getElementById("tumbler_value").text;
}

// check if the user has entered target distance and time otherwise
// to not start the app and highlight the missing value by painting
// the respective button red
function check_input (){
  setDistance.style.fill = "white";
  setTime.style.fill     = "white";
  let youcanstart = true;
  if (target_dist==0){
    setDistance.style.fill = "red";
    youcanstart = false;
  }
  if ((target_hour==0) & (target_min==0)){
    setTime.style.fill = "red";
    youcanstart = false;
  }
  return youcanstart;
}


///////////////////////////////
// SWITCHING BETWEEN SCREENS
/////////////////////////////

// function needed when switching between screens
function hideStartScreen() {
  startScreen.style.display  = "none";
  start_button.style.display = "none";
  setDistance.style.display  = "none";
  setTime.style.display      = "none";
  getGPS.style.display       = "none";
}

function showStartScreen() {
  let youcanstart = check_input()
  actually_showing = "start_screen"
  startScreen.style.display  = "inline";
  start_button.style.display = "inline";
  setDistance.style.display  = "inline";
  setTime.style.display      = "inline";
  getGPS.style.display       = "inline";
}

function showGPSScreen() {
  actually_showing = "GPS_screen"
  hideStartScreen()
  GPSScreen.style.display = "inline";
  GPSScreen_label.display = "inline";
}

function hideGPSScreen() {
  GPSScreen.style.display = "none";
  GPSScreen_label.display = "none";
}

// reset all style emlements to start conditions
function resetdefaults_IONIC (){
   speed_up_slow_down_image.x      = 150
   speed_up_slow_down_image.y      = 160
   speed_up_slow_down_image.width  = 50
   speed_up_slow_down_image.height = 45  

   hr_label.x = 150
   hr_label.y = 225
   hr_label.style.fontSize = 30

   text_part1_label.x = 85
   text_part1_label.y = 180
   text_part1_label.style.fontSize = 30  
   
   youdo_label.style.fontSize      = 30
   youdo_label.x     = 5
   youdo_label.y     = 30

   pace_ms_label.style.fontSize    = 30
   pace_ms_label.x   = 5
   pace_ms_label.y   = 60
  
   youshould_label.style.fontSize  = 30
   youshould_label.x = 190
   youshould_label.y = 30
  
   pace_needed_ms_label.style.fontSize   = 30
   pace_needed_ms_label.x = 190
   pace_needed_ms_label.y = 60

   predicted_time_label.x = 90
   predicted_time_label.y = 100

   eta_label.x = 80
   eta_label.y = 150
   eta_label.style.fontSize = 50

   distance_label.style.fontSize = 30
   distance_label.x = 5
   distance_label.y = 225
  
   time_elapsed_label.style.fontSize = 30
   time_elapsed_label.x = 210
   time_elapsed_label.y = 225
  
   speed_up_slow_down_image.href = ""  
   hr_label.text = ""
   text_part1_label.text = ""
   text_part2_label.text = ""
   youdo_label.text  = ""   
   youshould_label.text = ""
   pace_needed_ms_label.text = ""
   predicted_time_label.text = ""
   eta_label.text = "" 
   distance_label.text = ""
   time_elapsed_label.text = ""
   pace_ms_label.text = ""
}

function resetdefaults_VERSA (){
   speed_up_slow_down_image.x      = screen_dimx*0.5 -35
   speed_up_slow_down_image.y      = 160
   speed_up_slow_down_image.width  = 50
   speed_up_slow_down_image.height = 45  

   hr_label.x = 130
   hr_label.y = 260
   hr_label.style.fontSize = 30

   text_part1_label.x = 55
   text_part1_label.y = 180
   text_part1_label.style.fontSize = 30  
   text_part2_label.x = 110
   text_part2_label.y = 180
   text_part2_label.style.fontSize = 30  
   
   youdo_label.style.fontSize      = 30
   youdo_label.x     = 5
   youdo_label.y     = 30

   pace_ms_label.style.fontSize    = 30
   pace_ms_label.x   = 5
   pace_ms_label.y   = 60
  
   youshould_label.style.fontSize  = 30
   youshould_label.x = 160
   youshould_label.y = 30
  
   pace_needed_ms_label.style.fontSize   = 30
   pace_needed_ms_label.x = 160
   pace_needed_ms_label.y = 60

   predicted_time_label.x = 70
   predicted_time_label.y = 100
  
   eta_label.x = 60
   eta_label.y = 150
   eta_label.style.fontSize = 50

   distance_label.style.fontSize = 30
   distance_label.x = 5
   distance_label.y = 225
  
   time_elapsed_label.style.fontSize = 30
   time_elapsed_label.x = 170
   time_elapsed_label.y = 225
  
   speed_up_slow_down_image.href = ""  
   hr_label.text = ""
   text_part1_label.text = ""
   text_part2_label.text = ""
   youdo_label.text  = ""   
   youshould_label.text = ""
   pace_needed_ms_label.text = ""
   predicted_time_label.text = ""
   eta_label.text = "" 
   distance_label.text = ""
   time_elapsed_label.text = ""
   pace_ms_label.text = ""
}

function showMainScreen(){
  actually_showing = "main_screen"
  show_rabbit = true
  
  target_hour = tumbler_hours_1.value*1.
  target_min  = tumbler_minutes_1.value*10.+tumbler_minutes_2.value*1.
  target_dist = (tumbler_km_1.value*10. + tumbler_km_2.value + tumbler_km_3.value *0.1) * 1000.
  
  mainScreen.style.display = "inline";

  pace_needed_ms_label.style.display = "inline"
  predicted_time_label.style.display = "inline"
  youdo_label.style.display          = "inline"
  youshould_label.style.display      = "inline"
  pace_ms_label.style.display        = "inline"
  eta_label.style.display            = "inline"
  text_part1_label.style.display     = "inline"
  text_part2_label.style.display     = "inline"
  distance_label.style.display       = "inline"
  time_elapsed_label.style.display   = "inline"
  hr_label.style.display             = "inline"
  speed_up_slow_down_image.display   = "inline"  
  play_pause_image.display           = "inline"  
  done_line1.style.display           = "inline"
  done_line2.style.display           = "inline"
  if (exercise.state == "started"){
      play_pause_image.href = "./resources/icons/btn_combo_pause_press_p.png"
  }else{
      play_pause_image.href = "./resources/icons/btn_combo_play_press_p.png"
  }

  my_line1.x1 = 0;
  my_line1.y1 = 65;
  my_line1.x2 = screen_dimx;
  my_line1.y2 = 65;
  my_line1.style.fill="white"; 

  my_line2.x1 = 0;
  my_line2.y1 = 110;
  my_line2.x2 = screen_dimx;
  my_line2.y2 = 110;
  my_line2.style.fill="white"; 

  my_line3.x1 = 0;
  my_line3.y1 = 195;
  my_line3.x2 = screen_dimx;
  my_line3.y2 = 195;
  my_line3.style.fill="white"; 

  done_line1.x1 = 0;
  done_line1.y1 = 65;
  done_line1.x2 = 0;
  done_line1.y2 = 65;
  done_line1.style.fill="blue"; 

  done_line2.x1 = 0;
  done_line2.y1 = 110;
  done_line2.x2 = 0;
  done_line2.y2 = 110;
  done_line2.style.fill="blue"; 
}

function hideMainScreen(){
   mainScreen.style.display           = "none";
   speed_up_slow_down_image.display   = "none"
   play_pause_image.display           = "none"
   pace_needed_ms_label.style.display = "none"
   predicted_time_label.style.display = "none"
   youdo_label.style.display          = "none"
   youshould_label.style.display      = "none"
   pace_ms_label.style.display        = "none"
   eta_label.style.display            = "none"
   text_part1_label.style.display     = "none"
   text_part2_label.style.display     = "none"
   distance_label.style.display       = "none"
   time_elapsed_label.style.display   = "none"
   hr_label.style.display             = "none"
   my_line1.x2 = 0
   my_line2.x2 = 0
   my_line3.x2 = 0
   done_line1.x2 = 0
   done_line2.x2 = 0
   done_line1.style.display = "none"
   done_line2.style.display = "none"
}

function showSetTimeScreen(){
  actually_showing = "setTime_screen"
  selectTimeScreen.style.display  = "inline";
  tumbler_hours_1.style.display   = "inline"
  tumbler_minutes_1.style.display = "inline"
  tumbler_minutes_2.style.display = "inline"
  settime_label.text              = "hh:mm"
  doubledot_label.text            = ":"
  if (device.modelName != "Ionic"){
    doubledot_label.x = 140
    doubledot_label.y = 135
  }
}
function hideSetTimeScreen() {
  tumbler_hours_1.style.display   = "none"
  tumbler_minutes_1.style.display = "none"
  tumbler_minutes_2.style.display = "none"
  settime_label.text = ""
  doubledot_label.text            = ""
  target_hour = tumbler_hours_1.value*1.
  target_min  = tumbler_minutes_1.value*10.+tumbler_minutes_2.value*1.
}

function showSetDistanceScreen(){
  actually_showing = "setDistance_screen"
  selectDistanceScreen.style.display = "inline";
  tumbler_km_1.style.display      = "inline"
  tumbler_km_2.style.display      = "inline"
  tumbler_km_3.style.display      = "inline"
  km_label.text = "km"
  dot_label.text = "."
  if (device.modelName != "Ionic"){
    dot_label.x = 180
    dot_label.y = 140
    km_label.x = 10
    km_label.y = 35
  }  
}

function hideSetDistanceScreen() {
  tumbler_km_1.style.display   = "none"
  tumbler_km_2.style.display   = "none"
  tumbler_km_3.style.display   = "none"
  km_label.text = ""
  dot_label.text = ""
  target_dist = (tumbler_km_1.value*10. + tumbler_km_2.value + tumbler_km_3.value*0.1) * 1000.
}

// subscreens of the main screen which onyl show selected views of the elements
// can be cycled through using the back button as long as the app is running
function show_rabbit_screen(){
   mainScreen.style.display  = "inline";
   show_rabbit = true
   main_screen_showing = "rabbit"
   
   play_pause_image.display         = "inline"  
   speed_up_slow_down_image.display = "inline"  
   text_part1_label.style.display   = "inline"
   hr_label.style.display           = "inline"
   speed_up_slow_down_image.x      = 10
   speed_up_slow_down_image.y      = 10
   speed_up_slow_down_image.width  = 170
   speed_up_slow_down_image.height = 170  
   if (device.modelName == "Ionic"){
      hr_label.x = 220
      text_part1_label.style.fontSize = 70
   }else{
      hr_label.x = 180
      text_part1_label.style.fontSize = 60
   }
   hr_label.y = 80
   hr_label.style.fontSize = 70

   text_part1_label.x = 20
   text_part1_label.y = 220
   
   speed_up_slow_down_image.href = ""  
   hr_label.text = ""
   text_part1_label.text = ""
   text_part2_label.text = "" 
}

function show_speed_screen(){
   mainScreen.style.display  = "inline";
   main_screen_showing = "speed"
  
   play_pause_image.display      = "inline"  
   pace_needed_ms_label.style.display = "inline"
   youdo_label.style.display     = "inline"
   youshould_label.style.display = "inline"  
   pace_ms_label.style.display   = "inline"
   hr_label.style.display        = "inline"
   show_rabbit = false

   youdo_label.style.fontSize = 30
   youdo_label.x = 10
   youdo_label.y = 50
   pace_ms_label.style.fontSize = 55
   pace_ms_label.x = 10
   pace_ms_label.y = 110
  
   youshould_label.style.fontSize  = 30
   youshould_label.x = 10
   youshould_label.y = 160
   pace_needed_ms_label.style.fontSize = 55
   pace_needed_ms_label.x = 10
   pace_needed_ms_label.y = 220

   if (device.modelName == "Ionic"){
      hr_label.x = 250
   }else{
      hr_label.x = 210
   }
   hr_label.y = 50
   hr_label.style.fontSize = 50
  
   speed_up_slow_down_image.href = ""  
   hr_label.text = ""
   youdo_label.text  = ""   
   youshould_label.text = ""
   pace_needed_ms_label.text = ""
   pace_ms_label.text = ""  
  
}   

function show_eta_screen(){
   mainScreen.style.display = "inline";
   main_screen_showing      = "eta"
   show_rabbit = false

   play_pause_image.display = "inline"  
   hr_label.style.display   = "inline"
   hr_label.x = 250
   hr_label.y = 50
   hr_label.style.fontSize = 50

   predicted_time_label.style.display = "inline"
   predicted_time_label.x = 30
   predicted_time_label.y = 90

   eta_label.style.display = "inline"
   eta_label.x = 20
   eta_label.y = 170
   eta_label.style.fontSize = 70

   time_elapsed_label.style.display = "inline"  
   time_elapsed_label.style.fontSize = 50
   time_elapsed_label.x = 60
   time_elapsed_label.y = 230
   if (device.modelName != "Ionic"){
      hr_label.x = 210
      predicted_time_label.x = 20
      eta_label.x = 5
      time_elapsed_label.x = 45
   }
  
} 

function show_distance_screen(){
   main_screen_showing          = "distance"
   mainScreen.style.display     = "inline";
   hr_label.style.display       = "inline"
   distance_label.style.display = "inline"  
   play_pause_image.display     = "inline"  
   show_rabbit = false
   if (device.modelName == "Ionic"){
     distance_label.style.fontSize = 75
     time_elapsed_label.style.fontSize = 75
   }else{
     distance_label.style.fontSize = 65
     time_elapsed_label.style.fontSize = 65
   }
   distance_label.x = 15
   distance_label.y = 120
  
   time_elapsed_label.style.display = "inline"  
   time_elapsed_label.x = 15
   time_elapsed_label.y = 210
  
   hr_label.text = ""
   distance_label.text = ""
   time_elapsed_label.text = ""
} 


///////////////////////////
// BUTTONS
/////////////////////////

// physical button interactions. While the app is
// running one can cycle through the different views by using the 
// back button. The upper right button allows to switch speed units from 
// m/s to km/h to min/km
// the down button can be used to start stop the counting
document.onkeypress = function(e) {
  e.preventDefault();
  if (e.key == "up"){
    if (actually_showing  == "start_screen"){
      hideStartScreen()
      showSetDistanceScreen()
      setDistance.style.fill = "white";
    } 
    if (actually_showing  == "main_screen"){
       myunit_index = myunit_index +1
       if (myunit_index >= 3){
          myunit_index = 0
       }
    } 
  }
  if (e.key == "down"){
    if (actually_showing  == "start_screen"){
      hideStartScreen()
      showSetTimeScreen()
      setTime.style.fill = "white";
    } 
    
    if (actually_showing  == "main_screen"){
      if (stop_counting == false){
        stop_counting = true
        play_pause_image.href = "./resources/icons/btn_combo_play_press_p.png"
        if (exercise.state == "started") {
          exercise.pause();
        }  
      }
      else{
        stop_counting = false
        play_pause_image.href = "./resources/icons/btn_combo_pause_press_p.png"
        if (exercise.state == "paused") {
          exercise.resume();
        }else{
           exercise.start("run", { gps: true })
        }
      }
    } 
  }
  if (e.key == "back"){
    if (actually_showing  == "start_screen"){
      me.exit();
    }else{
      if (actually_showing  == "main_screen"){
        if (stop_counting) {
          if (exercise.state == "paused") {
            exercise.stop();
          }          
          hideMainScreen()
          showStartScreen()
        }else{
        // mydisplay = ['all','rabbit_turtle','speed','eta','distance','time_elapsed']
           mydisplay_index = mydisplay_index +1
           if (mydisplay_index >= 5){
              mydisplay_index = 0
           }
           if (mydisplay[mydisplay_index] == 'all'){
             hideMainScreen()
             showMainScreen()
             if (device.modelName == "Ionic"){
               resetdefaults_IONIC()
             }else{
               resetdefaults_VERSA()
             }  
           }
           else if (mydisplay[mydisplay_index] == 'rabbit_turtle'){
             hideMainScreen()
             show_rabbit_screen()
           }
           else if (mydisplay[mydisplay_index] == 'speed'){
             hideMainScreen()
             show_speed_screen()             
           }
           else if (mydisplay[mydisplay_index] == 'eta'){
             hideMainScreen()
             show_eta_screen()             
           }
           else if (mydisplay[mydisplay_index] == 'distance'){
             hideMainScreen()
             show_distance_screen()             
           }
        }
      }else{
        hideSetTimeScreen()
        hideSetDistanceScreen()
        hideGPSScreen()
        showStartScreen()
      }        
    }
  }
}


// try to get a GPS signal when GPS button was pressed
getGPS.onactivate = function(evt) {
  showGPSScreen()
  GPSScreen_label.text   = "  SEARCHING!  "
  geolocation.getCurrentPosition(locationSuccess, locationError, {
    timeout: 60 * 1000
  });  
  GPS = false
  function locationError(error) {
    GPSScreen_label.text = "NOT CONNECTED!"
  }  
  
  function locationSuccess(position) {
    console.log('got connection')
    GPSScreen_label.text = "  CONNECTED!  "
  }  
}

// when the start button was pressed, check if all needed values
// are available and if so switch to the main screen
start_button.onactivate = function(evt) {
  let youcanstart = check_input()
  
  if (youcanstart == true){
    // get from the tumbler the needed time and convert it to total seconds
    exercise.start("run", { gps: true })
    target_time_in_s = target_hour*60.*60.+target_min*60.+target_sec*1.
    hideStartScreen()
    set_reset_variables()
    startWatch()
    if (device.modelName == "Ionic"){
     resetdefaults_IONIC()
    }else{
     resetdefaults_VERSA()
    }      
    mydisplay_index = 0
    main_screen_showing = "all"
    showMainScreen()
    //play_pause_image.display = "inline"
    play_pause_image.href = "./resources/icons/btn_combo_pause_press_p.png"
  }
}

// use the Button to switch to the set distance screen
setDistance.onactivate = function(evt) {
  hideStartScreen()
  showSetDistanceScreen()
}

// use the Button to switch to the set time screen
setTime.onactivate = function(evt) {
  hideStartScreen()
  showSetTimeScreen()
}



////////////////////////////////////////
// FUNCTIONS WITH MAIN FUNCTIONALITIES
//////////////////////////////////////

 
// use the exercise funtion to get the distance
function calculate_distance(){
  if (exercise.state == "started"){
    let dist_now = exercise.stats.distance
  } else {
    let dist_now = 0 
  }  

  distance = dist_now-prevdist
  prevdist = dist_now
  if (stop_counting == true){
    distance = 0
  }
  total_distance = total_distance + distance
  if ((distance_update_step != 0) & (distance != 0))  {
    speed_ms = distance/distance_update_step;
  } else {
    speed_ms = 0;
  }      
}

function display_speed(){
  let part1 = Math.floor(speed_ms)
  let part2 = Math.floor((speed_ms-part1)*100)
  if (myunit[myunit_index] == "ms"){
    if (main_screen_showing != "speed"){
      pace_ms_label.style.fontSize = 30
    }
    pace_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} m/s`;
  }else if (myunit[myunit_index] == "kmh"){
    if (main_screen_showing != "speed"){
      pace_ms_label.style.fontSize = 30
    }
    let conversionfact = 3.6
    let part1 = Math.floor(speed_ms*conversionfact)
    let part2 = Math.floor((speed_ms*conversionfact-part1)*100) 
    pace_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} kmh`;
  }else if (myunit[myunit_index] == "minkm"){
    if (main_screen_showing != "speed"){
      pace_ms_label.style.fontSize = 30
    }
    let conversionfact = 1000/60
    let part1 = Math.floor(1/(speed_ms)*conversionfact)
    let part2 = Math.floor((1/(speed_ms)*conversionfact-part1)*100) 
    pace_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} /km`;
    if (speed_ms <= 0.01){
      pace_ms_label.text = `${util.zeroPad(0)}.${util.zeroPad(0)} /km`;
    }
  }
}

function display_time_elapsed(hours,mins,secs){
  let time_elapsed = `${util.zeroPad(hours)}:${util.zeroPad(mins)}:${util.zeroPad(secs)}`
  time_elapsed_label.text = `${time_elapsed}`;
}

// CALCULATE AND DISPLAY TOTAL DISTANCE DONE IN KM
function display_distance(){
  let part1 = Math.floor(total_distance/1000.)
  let part2 = Math.floor((total_distance/1000.-part1)*100.) 
  if ((part1>=0)& (part2 >=0)){
    distance_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} km`;
  }else{
    distance_label.text = `${util.zeroPad(0)}.${util.zeroPad(0)} km`;
  }
}

// CALCULATE AND DISPLAY ESTIMATED TIME ARRIVAL
function display_estimated_time_arrival(remaining_sec,tdiff){
  if (speed_ms  <= 0.0001){speed_ms=0.001}
  if (total_distance > target_dist){
    if (done == 0){
      finaltime = time_elapsed
    }
    done = 1
  }
  let total_sec   = tdiff + remaining_sec
  if (total_sec == 0){total_sec=1}
  let total_hours = Math.floor(total_sec/60/60)
  let total_mins  = Math.floor( (total_sec - total_hours*60*60)/60  )
  let total_sec   = Math.round(total_sec - total_hours*60*60 - total_mins*60)
  if (total_hours > 99){
    total_hours = 99;
    total_mins  = 99;     
    total_sec  = 99;    
  }

  // if you havent reached the target yet everything should be > 0
  if ((total_hours>=0)& (total_mins>=0) & (total_sec>=0)){
    eta_label.text = `${util.zeroPad(total_hours)}:${util.zeroPad(total_mins)}:${util.zeroPad(total_sec)}`;
    done = 0
  }else{
    eta_label.text = `${util.zeroPad(0)}:${util.zeroPad(0)}:${util.zeroPad(0)}`;
    if (done == 0){
      finaltime = time_elapsed
    }
    done = 1
  }
  // if you're not finished and you are too slow:
  if ((tdiff + remaining_sec) > target_time_in_s){
    eta_label.style.fill = "orange"

    // if the rabbit screen is displayed show image else hide it
    if (show_rabbit){
      speed_up_slow_down_image.href = "./resources/icons/rabbit_red.png"
      if (main_screen_showing != "rabbit"){
        if (device.modelName == "Ionic"){
            speed_up_slow_down_image.x = 165
        }else{
            speed_up_slow_down_image.x = 130
        }
      }
    }else{
      speed_up_slow_down_image.href = ""
      speed_up_slow_down_image.x = 0
    }

    // if the rabbit is displayed use ony one text label
    // otherwise split the "speed up" text and use two labels
    // to display it
    if (main_screen_showing != "rabbit"){
      if (device.modelName == "Ionic"){
         text_part1_label.x = 85
         text_part2_label.x = 225
      }else{
         text_part1_label.x = 45
         text_part2_label.x = 195
      }
      text_part1_label.text = "speed"
      text_part1_label.style.fill = "orange"
      text_part2_label.text = "up!"
      text_part2_label.style.fill = "orange"
    }else{
      text_part1_label.text = "speed up!"
      text_part1_label.style.fill = "orange"
    }
    predicted_time_label.style.fill = "orange"
  // if you're not finished and you are too fast:
  } else {
    eta_label.style.fill = "green"
    if (show_rabbit){
      speed_up_slow_down_image.href = "./resources/icons/turtle_green.png"
      if (main_screen_showing != "rabbit"){
        if (device.modelName == "Ionic"){
          speed_up_slow_down_image.x = 150
        }else{
          speed_up_slow_down_image.x = 130
        }
      }
    }else{
      speed_up_slow_down_image.href = ""
      speed_up_slow_down_image.x = 0
    }
    if (main_screen_showing != "rabbit"){
      text_part1_label.text = "slow"
      text_part1_label.style.fill = "green"
      text_part2_label.text = "down!"
      text_part2_label.style.fill = "green"
      if (device.modelName == "Ionic"){
        text_part1_label.x = 82
        text_part2_label.x = 205
      }else{
        text_part1_label.x = 62
        text_part2_label.x = 185
      }
    }else{
      text_part1_label.text = "slow down!"
      text_part1_label.style.fill = "green"
    }
    predicted_time_label.style.fill = "green"
  }  
}

function display_done(){
  eta_label.text = `${finaltime}`;
  eta_label.style.fill = "white"
  speed_up_slow_down_image.href = ""
  speed_up_slow_down_image.x = 150
  text_part1_label.text = ""
  text_part1_label.x = 82
  text_part1_label.style.fill = "white"
  text_part2_label.x = 205
  text_part2_label.text = ""
  text_part2_label.style.fill = "white"       
}

// depending on the chosen unit calculate and display the needed speed 
// to reach the target destination within the target time
function display_speed_needed(target_speed){
  let part1 = Math.floor(target_speed)
  let part2 = Math.floor((target_speed-part1)*100) 
  if (myunit[myunit_index] == "ms"){
    if (main_screen_showing != "speed") {
      pace_needed_ms_label.style.fontSize = 30
      if (device.modelName == "Ionic"){
        pace_needed_ms_label.x =200
        youshould_label.x = 200    
      }else{
        pace_needed_ms_label.x =160
        youshould_label.x = 160 
      }
    }
    if ((part2 >=0) & (part1 >=0)){
      pace_needed_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} m/s`;
    }else{
      pace_needed_ms_label.text = `${util.zeroPad(0)}.${util.zeroPad(0)} m/s`;
    }
  }else if (myunit[myunit_index] == "kmh"){
    let conversionfact = 3.6
    let part1 = Math.floor(target_speed*conversionfact)
    let part2 = Math.floor((target_speed*conversionfact-part1)*100) 
    if (main_screen_showing != "speed") {
      pace_needed_ms_label.style.fontSize = 30
      if (device.modelName == "Ionic"){
        pace_needed_ms_label.x =190
        youshould_label.x = 190
      }else{
        pace_needed_ms_label.x =160
        youshould_label.x = 160
      }
    }
    if ((part2 >=0) & (part1 >=0)){
      pace_needed_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} kmh`;
    }else{
      pace_needed_ms_label.text = `${util.zeroPad(0)}.${util.zeroPad(0)} kmh`;
    }
  }else if (myunit[myunit_index] == "minkm"){
    let conversionfact = 1000/60
    let part1 = Math.floor(1/target_speed*conversionfact)
    let part2 = Math.floor((1/target_speed*conversionfact-part1)*100) 
    if (main_screen_showing != "speed") {
      pace_needed_ms_label.style.fontSize = 30
      if (device.modelName == "Ionic"){
        pace_needed_ms_label.x =190
        youshould_label.x = 190
      }else{
        pace_needed_ms_label.x =160
        youshould_label.x = 160
      }
    }
    if ((part2 >=0) & (part1 >=0)){
      pace_needed_ms_label.text = `${util.zeroPad(part1)}.${util.zeroPad(part2)} /km`;
    }else{
      pace_needed_ms_label.text = `${util.zeroPad(0)}.${util.zeroPad(0)}/km`;
    }
  }else if (myunit[myunit_index] == "none"){
      pace_needed_ms_label.text = ""
  }
}

function display_text(){
  // DISPLAY TEXT                                            
  if (myunit[myunit_index] == "none"){
     youdo_label.text = ""    
     youshould_label.text = ""    
  }else{
     youdo_label.text = "you do:"    
     youshould_label.text = "you should:"    
  }

  if (done == true){
    predicted_time_label.text = "your final time:";
    predicted_time_label.style.fill = "white"
  }else{
    predicted_time_label.text = "predicted time:";
  }
  if (device.modelName == "Ionic"){
    predicted_time_label.x = 40;
  }else{
    predicted_time_label.x = 20;
  }  
}

function startWatch(){
  // Update the <text> element every tick with the current time
  clock.granularity = "seconds";
  clock.ontick = (evt) => 
  { 
    let now   = evt.date;
    if (isstarted == false){
      s_hours = now.getHours();
      s_mins  = now.getMinutes();
      s_secs  = now.getSeconds();
      isstarted =true
    }    

    // CALCULATE ELAPSED TIME
    let tdiff = (now.getHours()*60*60+now.getMinutes()*60+now.getSeconds()) - (s_hours*60*60+s_mins*60+s_secs)
    if (stop_counting == true){
      seconds_stopped = seconds_stopped + 1
      distance = 0
      speed_ms = 0      
    }  
    tdiff = tdiff - seconds_stopped
    let hours = Math.floor( tdiff/(60*60));
    let mins  = Math.floor((tdiff- hours*60*60)/60);
    let secs  = tdiff- hours*60*60 - mins*60;
    // CALCULATE the time left until reaching the target time
    let remaining_sec  = (target_dist - total_distance)/(speed_ms);
    // CALCULATE AND DISPLAY NEEDED PACE in M/S
    let target_speed = (target_dist - total_distance) / (target_time_in_s-tdiff)

    // Update display
    display_time_elapsed(hours,mins,secs)
    display_speed()
    display_speed_needed(target_speed)
    display_distance()
    display_estimated_time_arrival(remaining_sec,tdiff)
    display_text()
    // if the time is up and the target was reached freeze the screen
    if (done != 0){
      display_done()
    }

    // GET AND SHOW HEART RATE
    hr_label.text = heart_rate.heartRate;

    if ((total_distance != 0) & (target_dist != 0) ){
      done_line1.x2 = (total_distance/target_dist)*screen_dimx
      done_line2.x2 = (total_distance/target_dist)*screen_dimx
    }
  }
}


////////////////
// STARTUP
///////////////

// only track the distance every x seconds
setInterval(calculate_distance, distance_update_step * 1000);


