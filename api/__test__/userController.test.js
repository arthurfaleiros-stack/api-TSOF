import { jest } from "@jest/globals";

jest.unstable_mockModule("../src/db/connect.js", () => ({
  default: { query: jest.fn() },
}));

jest.unstable_mockModule("../src/services/validateCpf.js", () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule("bcrypt", () => ({
  default: { hash: jest.fn().mockResolvedValue("$hashed"), compareSync: jest.fn() },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: jest.fn().mockReturnValue("token_fake") },
}));

const { default: userController } = await import("../src/controllers/userController.js");
const { default: connect } = await import("../src/db/connect.js");
const { default: validateCpf } = await import("../src/services/validateCpf.js");
const { default: bcrypt } = await import("bcrypt");

const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };

const bodyValido = { cpf: "12345678901", email: "t@t.com", password: "s123", name: "T", data_nascimento: "2000-01-01" };

describe("userController - Testes Unitarios", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("createUser", () => {
    it("CT01 - cria usuario e retorna 201 com dados validos", async () => {
      validateCpf.mockResolvedValue(null);
      connect.query.mockImplementation((q, v, cb) => cb(null));
      const res = mockRes();
      await userController.createUser({ body: bodyValido }, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("CT02 - retorna 400 quando faltar campo obrigatorio", async () => {
      const res = mockRes();
      await userController.createUser({ body: { cpf: "12345678901" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("CT03 - retorna 400 quando CPF ja cadastrado", async () => {
      validateCpf.mockResolvedValue({ error: "CPF j\u00e1 cadastrado" });
      const res = mockRes();
      await userController.createUser({ body: bodyValido }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("CT04 - retorna 400 quando email duplicado (ER_DUP_ENTRY)", async () => {
      validateCpf.mockResolvedValue(null);
      connect.query.mockImplementation((q, v, cb) => cb({ code: "ER_DUP_ENTRY", message: "email" }));
      const res = mockRes();
      await userController.createUser({ body: bodyValido }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllUsers", () => {
    it("CT05 - retorna 200 com lista de usuarios", async () => {
      const users = [{ id_usuario: 1, name: "Joao" }];
      connect.query.mockImplementation((q, cb) => cb(null, users));
      const res = mockRes();
      await userController.getAllUsers({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users }));
    });

    it("CT06 - retorna 500 quando erro no banco", async () => {
      connect.query.mockImplementation((q, cb) => cb(new Error("db error"), null));
      const res = mockRes();
      await userController.getAllUsers({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("loginUser", () => {
    it("CT07 - retorna 400 quando email e senha ausentes", async () => {
      const res = mockRes();
      await userController.loginUser({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("CT08 - retorna 401 quando email nao existe", async () => {
      connect.query.mockImplementation((q, v, cb) => cb(null, []));
      const res = mockRes();
      await userController.loginUser({ body: { email: "x@x.com", password: "1" } }, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("CT09 - retorna 401 quando senha incorreta", async () => {
      connect.query.mockImplementation((q, v, cb) => cb(null, [{ id_usuario:1, password:"$h" }]));
      bcrypt.compareSync.mockReturnValue(false);
      const res = mockRes();
      await userController.loginUser({ body: { email: "x@x.com", password: "errada" } }, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("CT10 - retorna 200 com token quando login correto", async () => {
      connect.query.mockImplementation((q, v, cb) => cb(null, [{ id_usuario:1, email:"x@x.com", password:"$h" }]));
      bcrypt.compareSync.mockReturnValue(true);
      const res = mockRes();
      await userController.loginUser({ body: { email: "x@x.com", password: "certa" } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "token_fake" }));
    });
  });

  describe("deleteUser", () => {
    it("CT11 - retorna 404 quando usuario nao existe", async () => {
      connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 0 }));
      const res = mockRes();
      await userController.deleteUser({ params: { id: "9999" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("CT12 - retorna 200 quando usuario deletado", async () => {
      connect.query.mockImplementation((q, v, cb) => cb(null, { affectedRows: 1 }));
      const res = mockRes();
      await userController.deleteUser({ params: { id: "1" } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
