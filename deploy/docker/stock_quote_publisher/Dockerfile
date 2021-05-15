FROM python:2.7

RUN pip install pytz
RUN pip install requests
RUN pip install sendgrid
RUN pip install pika==0.12.0
RUN pip install yfinance

# Create app directory
WORKDIR /usr/src/app

RUN mkdir /usr/src/app/logs

# Bundle app source
COPY server/. ./server/
COPY config/. ./config/

ENV NODE_ENV production

CMD [ "python", "server/src/workers/StockQuotePublisher.py" ]
