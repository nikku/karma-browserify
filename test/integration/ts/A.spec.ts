import {A} from "./A";

describe('TypeScript Class A', () => {

  it('should instantiate a class', () => {
    let instance:A = new A();
    expect(instance).toBeDefined();
  })

})

// THIS FILE SHOULD NOT COMPILE BECAUSE TYPESCRIPT IS MISSING
// THE TYPE INFORMATION COMMENTED OUT BELOW

// declare class assert {
//   toBeDefined()
// }
// declare function expect(obj:any):assert
// declare function it(descrption:string, cb:Function)
// declare function describe(descrption:string, cb:Function)