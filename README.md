# browserspear
A framework for exploiting browsers by injecting Javascript to a web-based backdoor

# Aim of the project
- After a backdoor is injected in the browser (backdoor.html) the backdoor will try a websocket first and otherwise poll with GET requests. If a GET request succeeds but no websocket is possible (browser incompatible, proxy, filter, ... ) it will communicate in both ways with respectivly GET and reponse-headers.
- When a connection is available to a host it can be send Javascript-code to be executed on the machine
- Clients will be identified from the server with a couple commands and a database will be kept in a plain file
- The interface will be combined with the server (nodejs for async events). If the server is already running, make a connection to the existing server through HTTP requests or a websocket to have the same level of access
- Commands will only be accepted if comming from localhost
- The interface is a metasploit-like commnand-based system to list victims and send commands (custom or prepared payloads)
- Examples of payloads: webcam stream, audio record, keylogger, persistance, ... (check BeEF for inspiration)
- SSL protected connection with loadable cert (Future)

# Usage

# Credits
- Samy Kamkar for the inspiration through the Poisontab project
