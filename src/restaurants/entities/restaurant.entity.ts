import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

//entities는 오브젝트 개념의 리턴타입을 말해준다!
// @ObjectType() 이건 그래프큐엘을 위한것
// @Entity() 이건 typeorm 디비를 위한것!!
// Entity란 디비에 저장되는 방식!
// InputType 데코레이터(@)를 통해 dto에서 자동으로 같이 업데이트
//되게 만듬.. 그다음 resolver 에
//  @Args('input') createRestaurantDto: CreateRestaurantDto <- input 을 넣어야함!
// isAbstarct:ture해야 적용이됨!(확장시킨다고 보면됨!)
@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;
  //이곳이 플레이그라운드에 타입으로 나옴!

  @Field((type) => Boolean, { nullable: true })
  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;
  //isOptional을 쓰면 값을 안줘도 자동으로 true 대입한다!
  //@Field((type) => Boolean, { defaultValue: true })
  // @Column({ default: true })
  //field는 그래프큐엘을위한.. column은 디비를 위한 디폴트값임!!
  //nullable도 쓸수있으나.. 이거는 아예값이 안들어가는거고
  //defaultValue는 지정된값이.. 안쓰면 자동으로 넣어준다!

  @Field((type) => String, { defaultValue: 'Calgary' })
  @Column()
  @IsString()
  address: string;

  @Field((type) => String)
  @Column()
  @IsString()
  ownersName: string;

  //column을 붙여주면서 디비에 테이블컬럼을 추가함!!
  //필드는 그래프큐엘을 위한것!
  @Field((type) => String)
  @Column()
  @IsString()
  categoryName: string;
}