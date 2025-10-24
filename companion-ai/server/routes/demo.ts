import { Request, Response } from "express";

export function handleDemo(req: Request, res: Response) {
  const response = {
    message: "Secure Companion AI Server - Demo Route",
    timestamp: new Date().toISOString(),
    secure: true
  };
  res.status(200).json(response);
}
