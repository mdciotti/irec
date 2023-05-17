#include <iostream>
#include <boost/asio.hpp>
#include <boost/thread.hpp>

#include "AsyncSerial.h"
#include "BufferedAsyncSerial.h"

#define SERIAL_DEVICE "/dev/tty.usbserial-DA01OZ1M"
#define BAUD_RATE 9600

using namespace std;
using namespace boost;

int main(int argc, char* argv[])
{
    try {
        BufferedAsyncSerial serial(SERIAL_DEVICE, BAUD_RATE);

        // Return immediately. String is written *after* the function returns,
        // in a separate thread.
        // serial.writeString("Hello world\n");

        // Simulate doing something else while the serial device replies.
        // When the serial device replies, the second thread stores the received
        // data in a buffer.
        while (1) {
	        this_thread::sleep(posix_time::milliseconds(20));

	        // Always returns immediately. If the terminator \r\n has not yet
	        // arrived, returns an empty string.
	        std::string raw_telemetry_data = serial.readStringUntil("\r\n");
	        if (raw_telemetry_data.length() > 0) {
	        	cout << raw_telemetry_data << endl;
	    	}
    	}

        serial.close();
  
    } catch (boost::system::system_error &e)
    {
        cout << "Error: " << e.what() << endl;
        return 1;
    }

    return 0;
}