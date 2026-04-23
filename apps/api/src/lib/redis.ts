import Redis from "ioredis";
import { getRedisOptions } from "utils";

const { url, options } = getRedisOptions();

export const redis = new Redis(url, options);
