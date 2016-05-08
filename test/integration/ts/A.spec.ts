import {A} from "./A";

describe('TypeScript Class A', () => {
    it('should instantiate a class', () => {
      let instance:A = new A();
      console.warn('this test should run despite the compilation errors!')
      expect(instance).toBeDefined();
    })
  }
)

// uncomment following declarations, to make the typescript compile without errors
// and you will see the test is then executed.
/*
declare class assert {
  toBeDefined()
}
declare function expect(obj:any):assert
declare function it(descrption:string, cb:Function)
declare function describe(descrption:string, cb:Function)
*/
