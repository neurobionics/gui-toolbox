# GUI Toolbox

This VSCode extension helps you create a Graphical User Interface (GUI) for your Python scripts. It allows you to create a GUI with a few clicks and without writing any code. It uses gRPC to communicate with your python script and plotly to create real-time plots of your data that is being broadcasted by your python script. This extension was developed as a part of the [Open-Source Leg](https://opensourceleg.org) project.

## How To Use This Toolbox

1. Install this extension and reload your VSCode window.
2. Open the extension by clicking on the GUI Toolbox icon in the sidebar.
3. The first input field in the sidebar is where you can enter the IP address of the machine where your python script is running. If you are running the python script on the same machine as the GUI, you can leave this field as `localhost`.
4. After entering the IP address, choose your .proto file by clicking on the `Choose .proto file` button. This file should contain the definition of the gRPC services that your python script is providing. If you are using the opensourceleg library's gRPCManager class, this file is dynamically generated for you in your remote machine and placed in your current working directory. This proto file can then be downloaded to your local machine and used here.
5. You are all set! Create variables, buttons, and sliders that you want to use in your GUI. These three GUI elements are used to receive data from the user and pass it to your python script.
6. The GUI has a plot area by default where you can select the variables that are being broadcasted by your python script and plot them in real-time. You can also add multiple traces to the plot area.
