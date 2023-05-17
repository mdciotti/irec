#pragma once
/* 
 * File:   BufferedAsyncSerial.h
 * Author: Terraneo Federico
 * Distributed under the Boost Software License, Version 1.0.
 * Created on January 6, 2011, 3:31 PM
 */

#include "AsyncSerial.h"

class BufferedAsyncSerial: public AsyncSerial
{
public:
    BufferedAsyncSerial();

    /**
    * Opens a serial device.
    * \param devname serial device name, example "/dev/ttyS0" or "COM1"
    * \param baud_rate serial baud rate
    * \param opt_parity serial parity, default none
    * \param opt_csize serial character size, default 8bit
    * \param opt_flow serial flow control, default none
    * \param opt_stop serial stop bits, default 1
    * \throws boost::system::system_error if cannot open the
    * serial device
    */
    BufferedAsyncSerial(const std::string& devname, unsigned int baud_rate,
        boost::asio::serial_port_base::parity opt_parity=
            boost::asio::serial_port_base::parity(
                boost::asio::serial_port_base::parity::none),
        boost::asio::serial_port_base::character_size opt_csize=
            boost::asio::serial_port_base::character_size(8),
        boost::asio::serial_port_base::flow_control opt_flow=
            boost::asio::serial_port_base::flow_control(
                boost::asio::serial_port_base::flow_control::none),
        boost::asio::serial_port_base::stop_bits opt_stop=
            boost::asio::serial_port_base::stop_bits(
                boost::asio::serial_port_base::stop_bits::one));

    /**
     * Read some data asynchronously. Returns immediately.
     * \param data array of char to be read through the serial device
     * \param size array size
     * \return numbr of character actually read 0<=return<=size
     */
    size_t read(char *data, size_t size);

    /**
     * Read all available data asynchronously. Returns immediately.
     * \return the receive buffer. It iempty if no data is available
     */
    std::vector<char> read();

    /**
     * Read a string asynchronously. Returns immediately.
     * Can only be used if the user is sure that the serial device will not
     * send binary data. For binary data read, use read()
     * The returned string is empty if no data has arrived
     * \return a string with the received data.
     */
    std::string readString();

     /**
     * Read a line asynchronously. Returns immediately.
     * Can only be used if the user is sure that the serial device will not
     * send binary data. For binary data read, use read()
     * The returned string is empty if the line delimiter has not yet arrived.
     * \param delimiter line delimiter, default='\n'
     * \return a string with the received data. The delimiter is removed from
     * the string.
     */
    std::string readStringUntil(const std::string delim="\n");

    virtual ~BufferedAsyncSerial();

private:

    /**
     * Read callback, stores data in the buffer
     */
    void readCallback(const char *data, size_t len);

    /**
     * Finds a substring in a vector of char. Used to look for the delimiter.
     * \param v vector where to find the string
     * \param s string to find
     * \return the beginning of the place in the vector where the first
     * occurrence of the string is, or v.end() if the string was not found
     */
    static std::vector<char>::iterator findStringInVector(std::vector<char>& v,
            const std::string& s);

    std::vector<char> readQueue;
    boost::mutex readQueueMutex;
};

/* 
 * File:   BufferedAsyncSerial.cpp
 * Author: Terraneo Federico
 * Distributed under the Boost Software License, Version 1.0.
 * Created on January 6, 2011, 3:31 PM
 */

#include "BufferedAsyncSerial.h"

#include <string>
#include <algorithm>
#include <iostream>
#include <boost/bind.hpp>

using namespace std;
using namespace boost;

//
//Class BufferedAsyncSerial
//

BufferedAsyncSerial::BufferedAsyncSerial(): AsyncSerial()
{
    setReadCallback(boost::bind(&BufferedAsyncSerial::readCallback, this, _1, _2));
}

BufferedAsyncSerial::BufferedAsyncSerial(const std::string& devname,
        unsigned int baud_rate,
        asio::serial_port_base::parity opt_parity,
        asio::serial_port_base::character_size opt_csize,
        asio::serial_port_base::flow_control opt_flow,
        asio::serial_port_base::stop_bits opt_stop)
        :AsyncSerial(devname,baud_rate,opt_parity,opt_csize,opt_flow,opt_stop)
{
    setReadCallback(boost::bind(&BufferedAsyncSerial::readCallback, this, _1, _2));
}

size_t BufferedAsyncSerial::read(char *data, size_t size)
{
    boost::lock_guard<boost::mutex> l(readQueueMutex);
    size_t result=min(size,readQueue.size());
    vector<char>::iterator it=readQueue.begin()+result;
    copy(readQueue.begin(),it,data);
    readQueue.erase(readQueue.begin(),it);
    return result;
}

std::vector<char> BufferedAsyncSerial::read()
{
    boost::lock_guard<boost::mutex> l(readQueueMutex);
    vector<char> result;
    result.swap(readQueue);
    return result;
}

std::string BufferedAsyncSerial::readString()
{
    boost::lock_guard<boost::mutex> l(readQueueMutex);
    string result(readQueue.begin(),readQueue.end());
    readQueue.clear();
    return result;
}

std::string BufferedAsyncSerial::readStringUntil(const std::string delim)
{
    boost::lock_guard<boost::mutex> l(readQueueMutex);
    vector<char>::iterator it=findStringInVector(readQueue,delim);
    if(it==readQueue.end()) return "";
    string result(readQueue.begin(),it);
    it+=delim.size();//Do remove the delimiter from the queue
    readQueue.erase(readQueue.begin(),it);
    return result;
}

void BufferedAsyncSerial::readCallback(const char *data, size_t len)
{
    boost::lock_guard<boost::mutex> l(readQueueMutex);
    readQueue.insert(readQueue.end(),data,data+len);
}

std::vector<char>::iterator BufferedAsyncSerial::findStringInVector(
        std::vector<char>& v,const std::string& s)
{
    if(s.size()==0) return v.end();

    vector<char>::iterator it=v.begin();
    for(;;)
    {
        vector<char>::iterator result=find(it,v.end(),s[0]);
        if(result==v.end()) return v.end();//If not found return

        for(size_t i=0;i<s.size();i++)
        {
            vector<char>::iterator temp=result+i;
            if(temp==v.end()) return v.end();
            if(s[i]!=*temp) goto mismatch;
        }
        //Found
        return result;

        mismatch:
        it=result+1;
    }
}

BufferedAsyncSerial::~BufferedAsyncSerial()
{
    clearReadCallback();
}