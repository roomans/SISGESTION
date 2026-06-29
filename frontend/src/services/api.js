import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3001/api",
  /*baseURL: "http://192.168.1.149:3001/api",*/
});