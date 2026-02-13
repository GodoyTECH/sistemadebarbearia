import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export function setupAuth(app: Express) {
  const pgStore = connectPgSimple(session);

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-session-secret",
      store: new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        tableName: "sessions",
        ttl: 7 * DAY_IN_MS,
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * DAY_IN_MS,
      },
    }),
  );
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req?.session?.userId) {
    req.authUserId = req.session.userId;
    return next();
  }

  return res.status(401).json({ message: "Faça login para continuar." });
};
