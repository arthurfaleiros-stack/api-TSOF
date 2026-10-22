/**
 * Testes de Integracao - Organizador Controller
 * Pre-requisito: docker-compose up -d
 */
import supertest from "supertest";

const BASE_URL = "http://localhost:5000";
const request = supertest(BASE_URL);

const TS = Date.now().toString().slice(-8);

const organizadorTeste = {
  nome: `Org Teste ${TS}`,
  email: `org_${TS}@integration.com`,
  senha: "senha123",
  telefone: `119${TS.padStart(8, "0")}`.slice(0, 11),
};

let idCriado = null;

describe("Organizador - Testes de Integracao", () => {
  // ================================================================
  describe("POST /api/v1/organizador - Criar Organizador", () => {
    // CT01 - Dados validos: deve retornar 201
    it("CT01 - cria organizador com dados validos e retorna 201", async () => {
      const response = await request
        .post("/api/v1/organizador")
        .send(organizadorTeste);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Organizador criado com sucesso");
    });

    // CT02 - Campos faltando: deve retornar 400
    it("CT02 - retorna 400 quando campos obrigatorios estao ausentes", async () => {
      const response = await request
        .post("/api/v1/organizador")
        .send({ nome: "Sem email" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    // CT03 - Email sem @: deve retornar 400
    it("CT03 - retorna 400 quando email e invalido (sem @)", async () => {
      const response = await request.post("/api/v1/organizador").send({
        ...organizadorTeste,
        email: "emailsemarroba.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Email inv/);
    });

    // CT04 - Telefone invalido: deve retornar 400
    it("CT04 - retorna 400 quando telefone e invalido (menos de 11 digitos)", async () => {
      const response = await request.post("/api/v1/organizador").send({
        ...organizadorTeste,
        telefone: "9999",
        email: `alt_${TS}@test.com`,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Telefone inv/);
    });
  });

  // ================================================================
  describe("GET /api/v1/organizador - Listar Organizadores", () => {
    // CT05 - Deve retornar 200 com array
    it("CT05 - retorna 200 com lista de organizadores", async () => {
      const response = await request.get("/api/v1/organizador");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("organizadores");
      expect(Array.isArray(response.body.organizadores)).toBe(true);

      // Salva ID para testes seguintes
      const criado = response.body.organizadores.find(
        (o) => o.email === organizadorTeste.email
      );
      if (criado) idCriado = criado.id_organizador;
    });
  });

  // ================================================================
  describe("PUT /api/v1/organizador - Atualizar Organizador", () => {
    // CT06 - Atualizar dados validos: deve retornar 200
    it("CT06 - atualiza organizador existente e retorna 200", async () => {
      if (!idCriado) {
        console.warn("ID nao disponivel, pulando CT06");
        return;
      }

      const response = await request.put("/api/v1/organizador").send({
        id: idCriado,
        nome: "Nome Atualizado",
        email: organizadorTeste.email,
        senha: "novaSenha123",
        telefone: organizadorTeste.telefone,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Organizador atualizado com sucesso");
    });

    // CT07 - ID inexistente: deve retornar 404
    it("CT07 - retorna 404 quando o ID nao existe", async () => {
      const response = await request.put("/api/v1/organizador").send({
        id: 999999,
        nome: "Inexistente",
        email: `inex_${TS}@test.com`,
        senha: "senha123",
        telefone: "11999888777",
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Organizador nao encontrado");
    });
  });

  // ================================================================
  describe("DELETE /api/v1/organizador/:id - Deletar Organizador", () => {
    // CT08 - ID inexistente: deve retornar 404
    it("CT08 - retorna 404 quando o ID nao existe", async () => {
      const response = await request.delete("/api/v1/organizador/999999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Organizador nao encontrado");
    });

    // CT09 - Deleta organizador criado (cleanup)
    it("CT09 - deleta o organizador criado durante os testes (cleanup)", async () => {
      if (!idCriado) {
        console.warn("ID nao disponivel, pulando cleanup");
        return;
      }

      const response = await request.delete(`/api/v1/organizador/${idCriado}`);
      expect(response.status).toBe(200);
    });
  });
});
