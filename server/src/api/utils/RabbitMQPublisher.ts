import { AMQPConnector } from '../../shared/AMQPLib';
import { BaseLogger } from '../../shared/SGLogger';
import * as config from 'config';


export enum PayloadOperation {
  'CREATE' = 1,
  'UPDATE' = 2,
  'DELETE' = 3
}

const appName: string = "RabbitMQPublisher";

const amqpUrl = config.get('amqpUrl');
const rmqVhost = config.get('rmqVhost');
const rmqBrowserPushRoute = config.get('rmqBrowserPushRoute');
const rmqStockQuotePublisherQueue = config.get('rmqStockQuotePublisherQueue');
const exch = config.get('rmqExchange');


class RabbitMQPublisher {
  private amqp: AMQPConnector;
  private started: boolean = false;

  private async start() {
    let logger: BaseLogger = new BaseLogger(appName);
    logger.Start();
    this.amqp = new AMQPConnector(appName, '', amqpUrl, rmqVhost, 1, (activeMessages) => { }, logger);
    await this.amqp.Start();
    this.started = true;
  }

  // todo
  public async publish(domainType: string, correlationId: string, operation: PayloadOperation, data: any) {
    if (!this.started) {
      await this.start();
    }
    this.amqp.PublishRoute(exch, rmqBrowserPushRoute, { domainType, operation, model: data, correlationId });
  }


  public async publishStockQuotesSubscriptionUpdate(data: any) {
    if (!this.started) {
      await this.start();
    }
    this.amqp.PublishRoute(exch, rmqStockQuotePublisherQueue, data);
  }
}


export const rabbitMQPublisher = new RabbitMQPublisher();