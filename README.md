# ObjectGenerator
Generate objects with parsers (created from templates) and source data, featuring an internal cache.

## What is it?
  ObjectGenerator, or OG, is a module that provides an interface through which you can generate objects by providing
templates and source data. Useful for creating objects and arrays of objects that are derived from data, the module
also features an internal cache and the option to pass in additional parsers or generate parsers from templates.

## Why does it exist?
  I was recently working on a project where there were numerous drop-down lists, multi-selects, and other custom data
sets. These lists were exclusively hardcoded into the application, which decreased code readability, modularity, and
it would follow that it also had a negative impact on performance versus a more elegant solution (which, in this case,
would've been just about anything that involved a loop; or even recursion.)

  After reviewing the data sets, I determined that many of the sets contained very similar characteristics, and their
differences could be resolved with some simple parsing. I also noticed that I could generate all of the data sets from a
very minimal amount of information, which would make it feasible to take the minimal data and store it in a single
location where it could be parsed into the more complex data set that was required elsewhere in the application. After
implementing the generators, I started to wonder about the implications of generating the objects every time they were
requested. Since most of the data sets were derived from static data, I decided to abstract the generators and parsers
into a module that would feature automatic caching and would expose a provider that would allow you to retrieve the 
singleton instance of the ObjectGenerator. By implementing a cache and making OG a singleton, the performance was
drastically increased (when the cache isn't empty.) And here we are.

## More information soon...

### TO DO
- [ ] Documentation
- [ ] Tests
- [ ] Performance Tests
- [ ] Configuration
    - [ ] Cache size limit
- [ ] Interface to create additional instances, retrieve instances with an identifier
- [ ] Interface to manually clear cache