import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router } from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import './app/config/passport';
import passport from 'passport';
import expressSession from 'express-session';
import { envVars } from './app/config/env';
import notFound from './app/middlewares/notFound';

const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  })
);



app.use('/api', router);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WelCome to Local Guide Platform API',
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
