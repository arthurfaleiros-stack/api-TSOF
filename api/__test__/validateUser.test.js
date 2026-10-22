import validateUser from "../src/services/validateUser.js";

describe("validateUser - Testes Unitários", () => {
  const usuarioValido = {
    cpf: "12345678901",
    email: "aluno@senai.br",
    password: "123",
    name: "Aluno",
    data_nascimento: "2005-05-10",
  };

  // CT01 — retorna null para dados completamente válidos
  it("CT01 - retorna null quando todos os dados são válidos", () => {
    expect(validateUser(usuarioValido)).toBeNull(); // BUG CORRIGIDO: parêntese estava dentro do expect
  });

  // CT02 — campo obrigatório ausente: data_nascimento
  it("CT02 - retorna erro quando falta a data_nascimento", () => {
    const { data_nascimento, ...semData } = usuarioValido;
    expect(validateUser(semData)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  // CT03 — CPF com menos de 11 dígitos
  it("CT03 - retorna erro quando o cpf tem menos de 11 digitos", () => {
    expect(validateUser({ ...usuarioValido, cpf: "123" })).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  // CT04 — email sem @
  it("CT04 - retorna erro quando o email não tiver @", () => {
    expect(
      validateUser({ ...usuarioValido, email: "aluno.senai.br" })
    ).toEqual({
      error: "Email inválido. Deve conter @",
    });
  });

  // CT05 — CPF com mais de 11 dígitos
  it("CT05 - retorna erro quando o cpf tem mais de 11 digitos", () => {
    expect(
      validateUser({ ...usuarioValido, cpf: "123456789012" })
    ).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });

  // CT06 — campo name ausente
  it("CT06 - retorna erro quando falta o campo name", () => {
    const { name, ...semName } = usuarioValido;
    expect(validateUser(semName)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  // CT07 — campo password ausente
  it("CT07 - retorna erro quando falta o campo password", () => {
    const { password, ...semPassword } = usuarioValido;
    expect(validateUser(semPassword)).toEqual({
      error: "Todos os campos devem ser preenchidos",
    });
  });

  // CT08 — CPF com letras (não numérico)
  it("CT08 - retorna erro quando o cpf contiver letras", () => {
    expect(
      validateUser({ ...usuarioValido, cpf: "1234567890A" })
    ).toEqual({
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    });
  });
});