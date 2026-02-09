from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    storeNumber: str | None = None
    rememberMe: bool = False


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str | None = None
    email: EmailStr
    password: str
    phone: str
    role: str
    storeNumber: str | None = None
    storeName: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("Senha muito curta")
        if not value.isalnum():
            raise ValueError("Senha deve conter apenas letras e números")
        if not any(char.isalpha() for char in value) or not any(char.isdigit() for char in value):
            raise ValueError("Senha deve conter letras e números")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: EmailStr) -> EmailStr:
        local_part = str(value).split("@")[0]
        letters = sum(ch.isalpha() for ch in local_part)
        digits = sum(ch.isdigit() for ch in local_part)
        if letters < 4 or digits < 2:
            raise ValueError("E-mail deve ter ao menos 4 letras e 2 números antes do @")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = "".join(filter(str.isdigit, value))
        if len(digits) < 10:
            raise ValueError("Telefone inválido")
        return value


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
