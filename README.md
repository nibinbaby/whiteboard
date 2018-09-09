A realtime whiteboard application, inspired from other socket.io applications, written in angular5 and nodejs


Steps to deploy the code:

    1.clone the git repo into your machine.  git clone https://github.com/nibinbaby/whiteboard.git
    2.go to the server folder. cd <path to the repo dir>/whiteboard/server/
    3.run 'npm install' to install all the dependencies of the project.
    4.run 'node server.js' to start the server. note: I have used the server at 127.0.0.1.
    5.in new terminal, go to the client folder. cd <path to the repo dir>/whiteboard/client/
    6.run 'npm install' to install all the dependencies of the project.
    7.run 'ng serve'
    
take the application at http://localhost:4200/ to start using the whiteboard. A user name is to be given to start using the application.


The components of the application:
1. view the participants in the room.
2. support of free style drawing.
3. support of other drawing tools.
6. save of the canvas to mongodb and retaining for the user.
7. realtime socket communication for the joinees of the whiteboard.
