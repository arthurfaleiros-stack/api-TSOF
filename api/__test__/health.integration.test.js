/**
 * Testes de Integracao - Health Check
 * Pré-requisito: docker-compose up -d (API na porta 5000)
 */
import supertest from "supertest";

const BASE_URL = "http://localhost:5000";
const request = supertest(BASE_URL);

describe("Health Check - Testes de Integracao", () => {
  // CT01 - Rota raiz deve retornar status OK
  it("CT01 - GET / deve retornar { status: 'OK' }", async () => {
    const response = await request.get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "OK" });
  });
});
