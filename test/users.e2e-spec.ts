import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

//e2e test에서는 진짜 db nuber-eats-test를 만들어서 테스트 할것임!!

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'bnc3049@gmail.comTEST',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let usersRepository: Repository<User>;

  beforeAll(async () => {
    //db쓰기위해 모든걸 migrate(준비한다!이동!!)
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    //썻던 db를 초기화 시킨다!!
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    const EMAIL = 'bnc3049@gmail.comTEST';
    it('should create account', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner
            }) {
              ok
              error
            }
          }
          `,
        })
        .expect(200)
        .expect((res) => {
          //console.log(res) {data : {createAccount:{ok:true, error:null}}}
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email:"${EMAIL}",
              password:"12345",
              role:Owner
            }) {
              ok
              error
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe(
            'There is a user with that email already',
          );
          //toBe는 정확해야하고 toEqual은 객체타입만 맞아도 된다!
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }) {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          //login res에서 받은것!!
          //mutation {
          //login login이 뮤테이션이름이라 req의 data도 login으로 올것임!
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login with wrong credentials', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"xxx",
            }) {
              ok
              error
              token
            }
          }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      // const testUser = {
      //   id:1,
      //   email: 'bnc3049@gmail.comTEST',
      //   password: '12345',
      // }; <---이것이 찍혀 나올것이다!
      userId = user.id;
    });
    it("should see a user's profile", () => {
      return (
        request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set('X-JWT', jwtToken)
          //superTest를  사용해서 header를 설정하는방법임!!
          //post뒤에 set을통해 header를 설정할수있음(그래프큐엘 header처럼!)
          .send({
            query: `
        {
          userProfile(userId:${userId}){
            ok
            error
            user {
              id
            }
          }
        }
        `,
          })
          .expect(200)
          .expect((res) => {
            const {
              body: {
                data: {
                  userProfile: {
                    ok,
                    error,
                    user: { id },
                  },
                },
              },
            } = res;
            expect(ok).toBe(true);
            expect(error).toBe(null);
            expect(id).toBe(userId);
          })
      );
    });
    it('should not find a profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
        {
          userProfile(userId:666){
            ok
            error
            user {
              id
            }
          }
        }
        `,
        })
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  it.todo('me');
  it.todo('verifyEmail');
  it.todo('editProfile');
});
