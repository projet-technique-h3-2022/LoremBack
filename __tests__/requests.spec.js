require("dotenv").config();

const app = require("../app");
const supertest = require("supertest");
const mongoose = require("mongoose");
const { User } = require("../database/models/User.model");
const { Request } = require("../database/models/Request.model");
const { Group } = require("../database/models/Group.model");
const { Article } = require("../database/models/Article.model");
const { Role, RequestState } = require("../database/enum");

let tokenAuthor = "";
let tokenAuthor2 = "";
let tokenEditor = "";
let tokenEditor2 = "";
let tokenInvalidRole =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyYmIxM2E3NTZiNzhkMmM5Mzg0NWExZCIsImVtYWlsIjoiZXphQGV6YS5mciIsImxhc3RuYW1lIjoiZXphIiwiZmlyc3RuYW1lIjoiZXphIiwicm9sZSI6Im5vdCB2YWxpZCIsImlhdCI6MTY1NjUwMzU2OX0.TSUVJtDCga7TR1ICZ0FU3VA3z9A5H0qdE_I5uNU-jWw";

let idArticle = "";
let idGroup = "";
let idRequest = "";

describe("Request API", () => {
  beforeAll(async () => {
    await mongoose
      .connect(process.env.TEST_DATABASE_URL)
      .then(() => console.log("Connected to mongo"))
      .catch((err) => console.error("Failed to connect to mongo, ", err));

    await supertest(app)
      .post("/api/v1/user/register")
      .send({
        lastname: "jean",
        firstname: "jean",
        email: "testeditor@test.fr",
        password: "jesuisunmotdepasse",
        role: Role.EDITOR,
      })
      .expect(201)
      .expect("Content-Type", /json/);

    const resEditor = await supertest(app)
      .post("/api/v1/user/login")
      .send({
        email: "testeditor@test.fr",
        password: "jesuisunmotdepasse",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const dataEditor = JSON.parse(resEditor.text);
    tokenEditor = dataEditor.token;

    await supertest(app)
      .post("/api/v1/user/register")
      .send({
        lastname: "jean",
        firstname: "jean",
        email: "testeditor2@test.fr",
        password: "jesuisunmotdepasse",
        role: Role.EDITOR,
      })
      .expect(201)
      .expect("Content-Type", /json/);

    const resEditor2 = await supertest(app)
      .post("/api/v1/user/login")
      .send({
        email: "testeditor2@test.fr",
        password: "jesuisunmotdepasse",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const dataEditor2 = JSON.parse(resEditor2.text);
    tokenEditor2 = dataEditor2.token;

    await supertest(app)
      .post("/api/v1/user/register")
      .send({
        lastname: "jean",
        firstname: "jean",
        email: "testauthor@test.fr",
        password: "jesuisunmotdepasse",
        role: Role.AUTHOR,
      })
      .expect(201)
      .expect("Content-Type", /json/);

    const resAuthor = await supertest(app)
      .post("/api/v1/user/login")
      .send({
        email: "testauthor@test.fr",
        password: "jesuisunmotdepasse",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const dataUser = JSON.parse(resAuthor.text);
    tokenAuthor = dataUser.token;

    await supertest(app)
      .post("/api/v1/user/register")
      .send({
        lastname: "jean",
        firstname: "jean",
        email: "testauthor2@test.fr",
        password: "jesuisunmotdepasse",
        role: Role.AUTHOR,
      })
      .expect(201)
      .expect("Content-Type", /json/);

    const resAuthor2 = await supertest(app)
      .post("/api/v1/user/login")
      .send({
        email: "testauthor2@test.fr",
        password: "jesuisunmotdepasse",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const dataUser2 = JSON.parse(resAuthor2.text);
    tokenAuthor2 = dataUser2.token;

    const resArticle = await supertest(app)
      .post("/api/v1/article")
      .send({
        title: "Titre",
        image: "https://picsum.photos/200/300",
        content:
          "CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT CONTENT",
      })
      .set("authorization", `Bearer ${tokenAuthor}`)
      .expect(201)
      .expect("Content-Type", /json/);

    const dataArticle = JSON.parse(resArticle.text);
    idArticle = dataArticle._id;

    const resGroup = await supertest(app)
      .post("/api/v1/group")
      .send({
        title: "GROUPTEST",
      })
      .set("authorization", `Bearer ${tokenEditor}`)
      .expect(201)
      .expect("Content-Type", /json/);

    const dataGroup = JSON.parse(resGroup.text);
    idGroup = dataGroup._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Article.deleteMany({});
    await Request.deleteMany({});
    await Group.deleteMany({});
    await mongoose.connection.close();
  });
  describe("Route /api/v1/request", () => {
    test("Method POST\t -> Valid Data", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: idArticle,
          id_group: idGroup,
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(201)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);
      let request = await Request.findById(data._id);
      request = JSON.parse(JSON.stringify(request));

      let article = await Article.findById(idArticle);
      article = JSON.parse(JSON.stringify(article));

      expect(article.published).toBe(RequestState.IN_WAIT);

      expect(data).toMatchObject(request);
      idRequest = data._id;
    });

    test("Method POST\t -> Invalid Data", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);

      expect(data).toHaveProperty("error");
    });

    test("Method POST\t -> Invalid Article", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: "idArticle",
          id_group: idGroup,
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);

      expect(data.error).toBe("Article ID not valid !");
    });

    test("Method POST\t -> Invalid Group", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: idArticle,
          id_group: "idGroup",
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);

      expect(data.error).toBe("Group ID not valid !");
    });

    test("Method POST\t -> Article Not Found", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: "62bc349abcadf6ed5bb802d3",
          id_group: idGroup,
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);

      expect(data.error).toBe("Article not found");
    });

    test("Method POST\t -> Group Not Found", async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: idArticle,
          id_group: "62bc349abcadf6ed5bb802d3",
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);

      expect(data.error).toBe("Group not found");
    });

    test("Method GET\t -> Valid DATA Editor User", async () => {
      const res = await supertest(app)
        .get("/api/v1/request")
        .set("authorization", `Bearer ${tokenEditor}`)
        .expect(200)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);
      let request = await Request.findById(idRequest)
        .populate("id_article")
        .populate("id_group");
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject([request]);
    });

    test("Method GET\t -> Valid DATA Author User", async () => {
      const res = await supertest(app)
        .get("/api/v1/request")
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(200)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);
      let request = await Request.findById(idRequest)
        .populate("id_article")
        .populate("id_group");
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject([request]);
    });

    test("Method GET\t -> Invalid User Role", async () => {
      const res = await supertest(app)
        .get("/api/v1/request")
        .set("authorization", `Bearer ${tokenInvalidRole}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("User role not valid !");
    });
  });

  describe("Route /api/v1/request/:id/valid", () => {
    test("Method DELETE\t -> Invalid User owner", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/valid`)
        .set("authorization", `Bearer ${tokenEditor2}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("User is not the owner of the group !");
    });

    test("Method DELETE\t -> Invalid Request ID", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}4/valid`)
        .set("authorization", `Bearer ${tokenEditor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("Request ID invalid !");
    });

    test("Method DELETE\t -> Valid DATA", async () => {
      let request = await Request.findById(idRequest);
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/valid`)
        .set("authorization", `Bearer ${tokenEditor}`)
        .expect(200)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject(request);
    });
  });

  describe("Route /api/v1/request/:id/cancel", () => {
    beforeAll(async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: idArticle,
          id_group: idGroup,
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(201)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);
      let request = await Request.findById(data._id);
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject(request);
      idRequest = data._id;
    });

    test("Method DELETE\t -> Invalid User owner", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/cancel`)
        .set("authorization", `Bearer ${tokenAuthor2}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("User is not the owner of the article !");
    });

    test("Method DELETE\t -> Invalid Id Request", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}4/cancel`)
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("Request ID invalid !");
    });

    test("Method DELETE\t -> Valid DATA", async () => {
      request = await Request.findById(idRequest);
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/cancel`)
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(200)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject(request);
    });
  });

  describe("Route /api/v1/request/:id/refuse", () => {
    beforeAll(async () => {
      const response = await supertest(app)
        .post("/api/v1/request")
        .send({
          id_article: idArticle,
          id_group: idGroup,
        })
        .set("authorization", `Bearer ${tokenAuthor}`)
        .expect(201)
        .expect("Content-Type", /json/);

      const data = JSON.parse(response.text);
      let request = await Request.findById(data._id);
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject(request);
      idRequest = data._id;
    });

    test("Method DELETE\t -> Invalid User owner", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/refuse`)
        .set("authorization", `Bearer ${tokenEditor2}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("User is not the owner of the group !");
    });

    test("Method DELETE\t -> Invalid Request ID", async () => {
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}4/refuse`)
        .set("authorization", `Bearer ${tokenEditor}`)
        .expect(400)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);

      expect(data.error).toBe("Request ID invalid !");
    });

    test("Method DELETE\t -> Valid DATA", async () => {
      request = await Request.findById(idRequest);
      const res = await supertest(app)
        .delete(`/api/v1/request/${idRequest}/refuse`)
        .set("authorization", `Bearer ${tokenEditor}`)
        .expect(200)
        .expect("Content-Type", /json/);

      const data = JSON.parse(res.text);
      request = JSON.parse(JSON.stringify(request));

      expect(data).toMatchObject(request);
    });
  });
});
