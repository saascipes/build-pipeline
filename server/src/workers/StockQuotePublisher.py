import sys
import os
import traceback
import time
from datetime import datetime
import socket
import logging
from logging.handlers import TimedRotatingFileHandler
from threading import Event
from threading import Thread
from pytz import utc
import json
import requests
import uuid

from rmq_comm import *

import yfinance as yf

if not os.path.exists('./logs'):
    os.mkdir('./logs')

logging.basicConfig()

wait_tracked_stocks_update_handler_exception = Event()

env = 'default'
if 'NODE_ENV' in os.environ:
    env = os.environ['NODE_ENV']

rmqUrl = None
rmqUsername = None
rmqPassword = None
rmqVhost = None
rmqStockQuotePublisherQueue = None
rmqBrowserPushRoute = None
rmqExchange = None
publishQuotesInterval = 3
environment = None
loggingLevel = None
useSSL = None
apiBaseUrl = None
apiPort = None
apiVersion = None
token = None


def loadConfigValues(configFile):
    global rmqUrl
    global rmqUsername
    global rmqPassword
    global rmqVhost
    global rmqStockQuotePublisherQueue
    global rmqBrowserPushRoute
    global publishQuotesInterval
    global rmqExchange
    global environment
    global loggingLevel
    global useSSL
    global apiBaseUrl
    global apiPort
    global apiVersion

    if os.path.exists(configFile):
        with open(configFile, 'r') as f:
            s = f.read()
            config = json.loads(s)
            if 'rmqUrl' in config:
                rmqUrl = config['rmqUrl']
            if 'rmqUsername' in config:
                rmqUsername = config['rmqUsername']
            if 'rmqPassword' in config:
                rmqPassword = config['rmqPassword']
            if 'rmqVhost' in config:
                rmqVhost = config['rmqVhost']
            if 'rmqStockQuotePublisherQueue' in config:
                rmqStockQuotePublisherQueue = config['rmqStockQuotePublisherQueue']
            if 'rmqBrowserPushRoute' in config:
                rmqBrowserPushRoute = config['rmqBrowserPushRoute']
            if 'rmqExchange' in config:
                rmqExchange = config['rmqExchange']
            if 'publishQuotesInterval' in config:
                publishQuotesInterval = int(config['publishQuotesInterval'])
            if 'environment' in config:
                environment = config['environment']
            if 'loggingLevel' in config:
                loggingLevel = config['loggingLevel']
            if 'useSSL' in config:
                useSSL = (config['useSSL'] == 'true')
            if 'API_BASE_URL' in config:
                apiBaseUrl = config['API_BASE_URL']
            if 'API_PORT' in config:
                apiPort = config['API_PORT']
            if 'API_VERSION' in config:
                apiVersion = config['API_VERSION']

loadConfigValues('config/default.json')
if env != 'default':
    loadConfigValues('config/{}.json'.format(env))

cm_logger = logging.getLogger('stock_quote_publisher')
cm_logger.setLevel(int(loggingLevel))

formatter = logging.Formatter('{"_timeStamp": "%(asctime)s", "_sourceHost": "%(host_name)s", "_appName": "%(app_name)s", "_logLevel": %(levelno)s, "details": %(message)s}')

stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.DEBUG)
stdout_handler.setFormatter(formatter)
cm_logger.addHandler(stdout_handler)

timed_rotating_file_handler = TimedRotatingFileHandler('./logs/stockquotepublisher.log', when='s', interval=30, backupCount=10)
timed_rotating_file_handler.setLevel(logging.DEBUG)
timed_rotating_file_handler.setFormatter(formatter)
cm_logger.addHandler(timed_rotating_file_handler)

host = socket.gethostname()
cml_adapter = logging.LoggerAdapter(cm_logger, {'build': environment, 'app_name': 'StockQuotePublisher', 'host_name': host})

rmqCon = None
rmqPublisher = None

subscriptions = {}


def logDebug(msgData):
    global cml_adapter
    cml_adapter.debug(json.dumps(msgData, default=str))


def logInfo(msgData):
    global cml_adapter
    cml_adapter.info(json.dumps(msgData, default=str))


def logError(msgData):
    global cml_adapter
    cml_adapter.error(json.dumps(msgData, default=str))


def RestAPICall(url, method, headers={}, data={}):
    global cml_adapter
    global token
    global apiBaseUrl
    global apiPort
    global apiVersion

    try:
        apiUrl = apiBaseUrl
        if apiPort != '':
            apiUrl += ':{}'.format(apiPort)
        url = '{}/api/{}/{}'.format(apiUrl, apiVersion, url)

        default_headers = {}

        headers.update(default_headers)

        if method == 'POST':
            res = requests.post(url=url, headers=headers, data=data)
        elif method == 'PUT':
            res = requests.put(url=url, headers=headers, data=data)
        elif method == 'GET':
            res = requests.get(url=url, headers=headers, data=data)
        else:
            raise Exception('{} method not supported'.format(method))
        if (str(res.json()['statusCode'])[0] != '2'):
            raise Exception('Call to {} returned {} - {}'.format(url, res.status_code, res.text))
        return res.json()['data']
    except Exception as ex:
        logError({"msg": str(ex), "Method": "RestAPICall", "url": url, "method": method, "headers": headers, "data": data})


def on_message(delivery_tag, body, async_consumer):
    global cml_adapter

    try:
        msg = json.loads(body)

        print('body -> ', body)
        
        subscriptions[msg['ticker']] = msg

        publisher_loop()

        async_consumer.acknowledge_message(delivery_tag)
    except Exception as ex:
        async_consumer.acknowledge_message(delivery_tag)
        logError({"msg": str(ex), "Method": "on_message", "body": body})


def stop_stock_subscription_update_handler():
    global rmqCon
    if rmqCon:
        rmqCon.stop()


def on_rmq_channel_opened():
    global rmqCon

    rmqCon.create_basic_publish_channel()
    

def create_stock_subscription_udpate_handler(args1, stop_event):
    global rmqCon
    global rmqUrl
    global rmqUsername
    global rmqPassword
    global rmqVhost
    global rmqScheduleUpdatesQueue
    global cml_adapter
    global wait_tracked_stocks_update_handler_exception
    global useSSL

    urlRoot = 'amqp'
    if useSSL:
        urlRoot += 's'
    rmqCon = AsyncConsumer('{0}://{1}:{2}@{3}/{4}?heartbeat_interval=30'.format(
        urlRoot,
        rmqUsername,
        rmqPassword,
        rmqUrl,
        rmqVhost),
        cml_adapter,
        {
            'exch': rmqExchange,
            'exch_type': 'topic',
            'durable': True,
            'queue_name': rmqStockQuotePublisherQueue,
            'exclusive': False,
            'auto_delete': False,
            'routing_key': rmqStockQuotePublisherQueue,
            'prefetch_count': 10,
            'no_ack': False,
            'on_message': on_message,
            'on_channel_opened': on_rmq_channel_opened,
            'exception_event': wait_tracked_stocks_update_handler_exception
        })

    rmqCon.run()


def publish_quote(quote):
    global rmqCon

    quote["id"] = uuid.uuid4().hex
    quote["time"] = int(time.time()*1000)

    msg = {"domainType": "quote", "operation": 1, "model": quote, "correlationId": 0 }
    rmqCon.basic_publish(msg, rmqBrowserPushRoute)
    print('published {} with route key {}'.format(msg, rmqBrowserPushRoute))


def publisher_loop():
    for key in subscriptions:
        subscription = subscriptions[key]
        try:
            tick = yf.Ticker(subscription['ticker'])

            publish_quote({'ticker': subscription['ticker'], 'bid': tick.info['bid'], 'bidSize': tick.info['bidSize'], 'ask': tick.info['ask'], 'askSize': tick.info['askSize'], 'last': tick.info['regularMarketPrice']})

            # totalSize = float(tick.info['bidSize']) + float(tick.info['askSize'])
            # wpx = float(tick.info['bid']) * float(tick.info['bidSize']) / totalSize + float(tick.info['ask']) * float(tick.info['askSize']) / totalSize
            # publish_quote({'ticker': subscription['ticker'], 'bid': tick.info['bid'], 'bidSize': tick.info['bidSize'], 'ask': tick.info['ask'], 'askSize': tick.info['askSize'], 'last': tick.info['regularMarketPrice'], 'wpx': wpx})
        except Exception as e:
            logError({"Msg": str(e), "Method": "run_publisher_async - {}".format(key)})


def run_publisher_async(args1, stop_event):
    """
    Run the stock quote publisher in a separate thread as it is blocking
    """
    global cml_adapter
    global subscriptions

    while(not stop_event.isSet()):
        try:
            publisher_loop()
            time.sleep(publishQuotesInterval)
        except Exception as e:
            logError({"Msg": str(e), "Method": "run_publisher_async"})
        

def main():
    global cml_adapter
    global wait_tracked_stocks_update_handler_exception
    global subscriptions
    global rmqCon
    global rmqPublisher

    try:
        # Get existing subscriptions
        res = RestAPICall('subscription', 'GET')
        print('*'*8, res)
        for subscription in res:
            subscriptions[subscription['ticker']] = subscription

        handle_subscription_updates_thread = Thread(
            target=create_stock_subscription_udpate_handler, args=(1, None))
        handle_subscription_updates_thread.start()

        run_publisher_async_thread_stop = Event()
        run_publisher_async_thread = Thread(
            target=run_publisher_async, args=(1, run_publisher_async_thread_stop))
        run_publisher_async_thread.start()

        while True:
            schedule_updates_exception_occurred = wait_tracked_stocks_update_handler_exception.wait(5)
            if schedule_updates_exception_occurred:
                cml_adapter.error({"msg": "Exception occurred in on_message event"})
                wait_tracked_stocks_update_handler_exception.clear()
    except KeyboardInterrupt:
        logInfo({"msg": "process interrupted - exiting", "Method": "main"})
        run_publisher_async_thread_stop.set()
        stop_stock_subscription_update_handler()
        handle_subscription_updates_thread.join()
        run_publisher_async_thread.join()
        sys.exit(0)
    except Exception as ex:
        logError({"msg": str(ex), "Method": "main"})
        traceback.print_exc(file=sys.stdout)
        sys.exit(0)


if __name__ == "__main__":
    main()
