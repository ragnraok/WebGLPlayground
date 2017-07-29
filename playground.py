#!/usr/bin/env python

import sys
import string
import SimpleHTTPServer
import SocketServer

if len(sys.argv) != 3:
    sys.exit(1)

addr = sys.argv[1]
port = string.atoi(sys.argv[2])

handler = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = SocketServer.TCPServer((addr, port), handler)
print "HTTP server is at: ", addr, port
httpd.serve_forever()
