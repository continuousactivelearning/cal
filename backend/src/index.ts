import './instrument';

import HTTP from 'http';
import Express from 'express';
import Sentry from '@sentry/node';
import { loggingHandler } from 'shared/middleware/loggingHandler';
import { appConfig } from 'config/app';
import { RoutingControllersOptions, useContainer, useExpressServer } from 'routing-controllers';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { authModuleOptions } from 'modules/auth';
import { coursesModuleOptions } from 'modules/courses';
import Container from 'typedi';
import { ICourseRepository, IDatabase } from 'shared/database';
import { MongoDatabase } from 'shared/database/providers/MongoDatabaseProvider';
import { dbConfig } from 'config/db';


export const application = Express();

export const ServiceFactory = (service: typeof application, options: RoutingControllersOptions, port: Number) => {
  console.log('--------------------------------------------------------');
  console.log('Initializing service server');
  console.log('--------------------------------------------------------');

  service.use(Express.urlencoded({ extended: true }));
  service.use(Express.json());

  console.log('--------------------------------------------------------');
  console.log('Logging and Configuration Setup');
  console.log('--------------------------------------------------------');

  service.use(loggingHandler);

  console.log('--------------------------------------------------------');
  console.log('Define Routing');
  console.log('--------------------------------------------------------');
  service.get('/main/healthcheck', (req, res) => {
    res.send('Hello World');
  }
  );
  service.get("/debug-sentry", (req, res) => {
    throw new Error("My first Sentry error!");
  });

  console.log('--------------------------------------------------------');
  console.log('Routes Handler');
  console.log('--------------------------------------------------------');
    //After Adding Routes
  Sentry.setupExpressErrorHandler(service);

  console.log('--------------------------------------------------------');
  console.log('Starting Server');
  console.log('--------------------------------------------------------');

  useExpressServer(service, options);

  service.listen(port, () => {
      console.log('--------------------------------------------------------');
      console.log('Started Server at http://localhost:' + port);
      console.log('--------------------------------------------------------');
  });

}

// Create a main function where multiple services are created


useContainer(Container);

if (!Container.has("Database")) {
    Container.set<IDatabase>("Database", new MongoDatabase(dbConfig.url, "vibe"));
}


export const main = () => {
  ServiceFactory(application, coursesModuleOptions, 4001);
}

main();