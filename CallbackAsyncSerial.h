#pragma once
#include "AsyncSerial.h"

class CallbackAsyncSerial: public AsyncSerial
{
public:
    CallbackAsyncSerial();

    CallbackAsyncSerial(const std::string& devname, unsigned int baud_rate,
        boost::asio::serial_port_base::parity opt_parity =
            boost::asio::serial_port_base::parity(
                boost::asio::serial_port_base::parity::none),
        boost::asio::serial_port_base::character_size opt_csize =
            boost::asio::serial_port_base::character_size(8),
        boost::asio::serial_port_base::flow_control opt_flow =
            boost::asio::serial_port_base::flow_control(
                boost::asio::serial_port_base::flow_control::none),
        boost::asio::serial_port_base::stop_bits opt_stop =
            boost::asio::serial_port_base::stop_bits(
                boost::asio::serial_port_base::stop_bits::one));

    void setCallback(const
            boost::function<void (const char*, size_t)> &callback);

    void clearCallback();

    virtual ~CallbackAsyncSerial();
};
