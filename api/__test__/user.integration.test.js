/**
 * Testes de Integracao - User Controller
 * Pre-requisito: docker-compose up -d (API na porta 5000, MySQL na 3307)
 *
 * Os testes usam dados unicos por execucao (timestamp) para evitar
 * conflito com dados existentes no banco.
 */
import supertest from "supertest";

const BASE_URL = "http://localhost:5000";
const request = supertest(BASE_URL);

// Timestamp unico por execucao para evitar conflito de CPF/email duplicados
const TS = Date.now().toString().slice(-9);

const usuarioTeste = {
  cpf: TS.padStart(11, "1"),             // CPF de 11 digitos unico
  email: `teste_${TS}@integration.com`, // Email unico
  password: "senha@123",
  name: "Usuario Teste Integration",
  data_nascimento: "2000-06-15",
};

let tokenValido = "";
let idCriado = null;

describe("User - Testes de Integracao", () => {
  // ================================================================
  describe("POST /api/v1/user - Criar Usuario", () => {
    // CT01 - Dados validos: deve criar e retornar 201
    it("CT01 - cria usuario com dados validos e retorna 201", async () => {
      const response = await request
        .post("/api/v1/user")
        .send(usuarioTeste);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Usuario criado com sucesso");
    });

    // CT02 - Campos faltando: deve retornar 400
    it("CT02 - retorna 400 quando campos obrigatorios estao ausentes", async () => {
      const response = await request
        .post("/api/v1/user")
        .send({ email: "sem@campos.com" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    // CT03 - CPF invalido: deve retornar 400
    it("CT03 - retorna 400 quando CPF e invalido", async () => {
      const response = await request.post("/api/v1/user").send({
        ...usuarioTeste,
        cpf: "123", // Menos de 11 digitos
        email: "outro@email.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/CPF inv/);
    });

    // CT04 - Email sem @: deve retornar 400
    it("CT04 - retorna 400 quando email e invalido (sem @)", async () => {
      const response = await request.post("/api/v1/user").send({
        ...usuarioTeste,
        email: "emailsemarroba.com",
        cpf: "99988877766",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Email inv/);
    });
  });

  // ================================================================
  describe("POST /api/v1/login - Login de Usuario", () => {
    // CT05 - Credenciais validas: deve retornar 200 com token
    it("CT05 - retorna 200 com token JWT quando credenciais sao validas", async () => {
      const response = await request.post("/api/v1/login").send({
        email: usuarioTeste.email,
        password: usuarioTeste.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("message", "Login bem-sucedido");

      tokenValido = response.body.token; // Salva para testes seguintes
    });

    // CT06 - Senha incorreta: deve retornar 401
    it("CT06 - retorna 401 quando a senha esta errada", async () => {
      const response = await request.post("/api/v1/login").send({
        email: usuarioTeste.email,
        password: "senha_ERRADA_999",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Senha incorreta");
    });

    // CT07 - Usuario inexistente: deve retornar 401
    it("CT07 - retorna 401 quando o email nao existe no sistema", async () => {
      const response = await request.post("/api/v1/login").send({
        email: "nao.existe.nunca@email.com",
        password: "qualquersenha",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Usuario nao encontrado");
    });

    // CT08 - Campos vazios: deve retornar 400
    it("CT08 - retorna 400 quando email ou senha nao sao enviados", async () => {
      const response = await request.post("/api/v1/login").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  // ================================================================
  describe("GET /api/v1/user - Listar Usuarios (requer token)", () => {
    // CT09 - Sem token: deve retornar 401
    it("CT09 - retorna 401 quando token nao e fornecido", async () => {
      const response = await request.get("/api/v1/user");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("auth", false);
    });

    // CT10 - Com token valido: deve retornar 200 com lista
    it("CT10 - retorna 200 com lista de usuarios quando token e valido", async () => {
      // Garante que temos um token (caso CT05 nao tenha rodado antes)
      if (!tokenValido) {
        const loginRes = await request.post("/api/v1/login").send({
          email: usuarioTeste.email,
          password: usuarioTeste.password,
        });
        tokenValido = loginRes.body.token;
      }

      const response = await request
        .get("/api/v1/user")
        .set("authorization", tokenValido);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(Array.isArray(response.body.users)).toBe(true);

      // Salva ID do usuario criado para o teste de delete
      const criado = response.body.users.find(
        (u) => u.email === usuarioTeste.email
      );
      if (criado) idCriado = criado.id_usuario;
    });
  });

  // ================================================================
  describe("DELETE /api/v1/user/:id - Deletar Usuario", () => {
    // CT11 - ID inexistente: deve retornar 404
    it("CT11 - retorna 404 quando o ID nao existe no banco", async () => {
      const response = await request.delete("/api/v1/user/999999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Usuario nao encontrado");
    });

    // CT12 - Deleta usuario criado no teste (cleanup)
    it("CT12 - deleta o usuario criado durante os testes (cleanup)", async () => {
      if (!idCriado) {
        console.warn("ID do usuario nao encontrado, pulando cleanup");
        return;
      }

      const response = await request.delete(`/api/v1/user/${idCriado}`);
      expect(response.status).toBe(200);
    });
  });
});
