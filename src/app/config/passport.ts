import bcryptjs from 'bcryptjs';
import passport, { Profile } from 'passport'
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../modules/user/user.model';
import {
  Strategy as GoogleStrategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { envVars } from './env';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      
      try {
        const isUserExist = await User.findOne({ email }).select('+passwordHash');

        if (!isUserExist) {
          return done(null, false, { message: 'User Not Exist' });
        }

        if (isUserExist.isDeleted) {
          return done(null, false, { message: 'User is deleted' });
        }

        if (isUserExist.isActive !== 'ACTIVE') {
          return done(null, false, { message: `User is ${isUserExist.isActive}` });
        }

        const isGoogleAuth = isUserExist.auths.some(
          providerObjects => providerObjects.provider === 'google'
        );

        if (isGoogleAuth && !isUserExist.passwordHash) {
          return done(null, false, {
            message:
              'You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.',
          });
        }

        if (!isUserExist.passwordHash) {
          return done(null, false, { message: 'Password not set for this user' });
        }

        const isHashPasswordMatch = await bcryptjs.compare(
          password,
          isUserExist.passwordHash
        );

        if (!isHashPasswordMatch) {
          return done(null, false, { message: 'Password Does Not Match' });
        }
        return done(null, isUserExist);
      } catch (error) {
        done(error);
      }
    }
  )
);


passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: 'No Email Found' });
        }

        let user = await User.findOne({ email });

        const authDetails = {
          provider: 'google',
          providerId: profile.id,
        };

        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0].value,
            role: 'TOURIST', // Default role for Google auth users
            isVerified: true,
            auths: [authDetails],
          });
        } else {
           const isAlreadyLinked = user.auths.some(
             auth => auth.provider === authDetails.provider
           );

           if (!isAlreadyLinked) {
             user.auths.push(authDetails);
             await user.save(); 
           }
        }


        return done(null, user);
      } catch (error) {
        console.log('Google Strategy Error:', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
