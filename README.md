# pacemaker
This is a fitbit app which acts as a pacemaker

This app acts as a pacemaker. You can set target distance and time
and it indicates wether you need to speed up or slow down. It's
accurate if GPS is used, otherwise it relies on the local distance
calculated by the device based on the steps.

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
