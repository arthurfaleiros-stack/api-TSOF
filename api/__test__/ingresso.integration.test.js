/**
 * Testes de Integracao - Ingresso Controller
 * Pre-requisito: docker-compose up -d
 * Nota: usa fk_id_evento=1 (seed do banco).
 */
import supertest from "supertest";

const BASE_URL = "http://localhost:5000";
const request = supertest(BASE_URL);

const ingressoBase = {
  preco: 150.5,
  tipo: "pista",
  fk_id_evento: 1, // Evento do seed
};

let idCriado = null;

describe("Ingresso - Testes de Integracao", () => {
  // ================================================================
  describe("POST /api/v1/ingresso - Criar Ingresso", () => {
    // CT01 - Dados validos: deve retornar 200
    it("CT01 - cria ingresso com dados validos e retorna 200", async () => {
      const response = await request
        .post("/api/v1/ingresso")
        .send(ingressoBase);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Ingresso criado com sucesso");
    });

    // CT02 - Campos faltando: deve retornar 400
    it("CT02 - retorna 400 quando campos obrigatorios estao ausentes", async () => {
      const response = await request
        .post("/api/v1/ingresso")
        .send({ preco: 50 }); // Faltando tipo e fk_id_evento

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Todos os campos devem ser preenchidos");
    });
  });

  // ================================================================
  describe("GET /api/v1/ingresso - Listar Ingressos", () => {
    // CT03 - Deve retornar 200 com lista
    it("CT03 - retorna 200 com lista de ingressos", async () => {
      const response = await request.get("/api/v1/ingresso");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ingressos");
      expect(Array.isArray(response.body.ingressos)).toBe(true);

      // Captura ID para proximos testes
      if (response.body.ingressos.length > 0) {
        idCriado = response.body.ingressos[response.body.ingressos.length - 1].id_ingresso;
      }
    });
  });

  // ================================================================
  describe("GET /api/v1/ingresso/evento/:id - Ingressos por Evento", () => {
    // CT04 - Evento existente: deve retornar ingressos do evento
    it("CT04 - retorna 200 com ingressos de um evento especifico", async () => {
      const response = await request.get("/api/v1/ingresso/evento/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ingressos");
      expect(Array.isArray(response.body.ingressos)).toBe(true);
    });

    // CT05 - Evento sem ingressos: deve retornar array vazio
    it("CT05 - retorna 200 com array vazio quando evento nao tem ingressos", async () => {
      const response = await request.get("/api/v1/ingresso/evento/999999");

      expect(response.status).toBe(200);
      expect(response.body.ingressos).toEqual([]);
    });
  });

  // ================================================================
  describe("PUT /api/v1/ingresso - Atualizar Ingresso", () => {
    // CT06 - Atualizar ingresso existente: deve retornar 200
    it("CT06 - atualiza ingresso existente e retorna 200", async () => {
      if (!idCriado) {
        console.warn("ID do ingresso nao disponivel, pulando CT06");
        return;
      }

      const response = await request.put("/api/v1/ingresso").send({
        id_ingresso: idCriado,
        preco: 200.0,
        tipo: "vip",
        fk_id_evento: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Ingresso atualizado com sucesso");
    });

    // CT07 - ID inexistente: deve retornar 404
    it("CT07 - retorna 404 quando o ID do ingresso nao existe", async () => {
      const response = await request.put("/api/v1/ingresso").send({
        id_ingresso: 999999,
        preco: 100,
        tipo: "pista",
        fk_id_evento: 1,
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Ingresso nao encontrado");
    });
  });

  // ================================================================
  describe("DELETE /api/v1/ingresso/:id - Deletar Ingresso", () => {
    // CT08 - ID inexistente: deve retornar 404
    it("CT08 - retorna 404 quando o ID nao existe", async () => {
      const response = await request.delete("/api/v1/ingresso/999999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Ingresso nao encontrado");
    });

    // CT09 - Deleta ingresso criado (cleanup)
    it("CT09 - deleta o ingresso criado durante os testes (cleanup)", async () => {
      if (!idCriado) {
        console.warn("ID do ingresso nao disponivel, pulando cleanup");
        return;
      }

      const response = await request.delete(`/api/v1/ingresso/${idCriado}`);
      expect(response.status).toBe(200);
    });
  });
});
