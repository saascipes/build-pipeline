FROM python:2.7


ENV NODE_ENV production

RUN pip install pytz
RUN pip install requests
RUN pip install sendgrid
RUN pip install pika==0.12.0
RUN pip install yfinance

RUN apt-get -y update
RUN apt-get -y install git libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

RUN curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh\
        && (( EUID )) && { sudo chmod +x nodesource_setup.sh; } || chmod +x nodesource_setup.sh\
        && ./nodesource_setup.sh\
        && (( EUID )) && { sudo apt install nodejs; } || apt install nodejs\
        && npm install tsc -g

ADD deploy/docker/sg-agent/sg-agent-launcher /
ADD deploy/docker/sg-agent/sg.cfg /

CMD [ "/sg-agent-launcher" ]
