CC=g++
CFLAGS=

all:
	$(CC) -o telemetry main.cpp -lboost_system -lboost_thread-mt
