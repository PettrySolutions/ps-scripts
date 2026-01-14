# Goal

Allow teams to analyze their javascript and typescript repos and package import patterns. This will help teams identify unusued exports components, constants, functions, and types within their repos, as well as identifying core exports for each package. 

## Input 

The path to a json file that will contain a config that adheres to the [InputConfig](../src/tools/import-mapping/types/InputConfig.ts) Type.

## Outputs

Two json files. 

The first named RepoPackages.json that adheres to the [RepoPackagesOutput](../src/tools/import-mapping/types/RepoPackagesOutput.ts) type. This first output will contain all of the imported values (classes, functions, constants, components, etc.) from the provided packages. 

The second named AllExports.json that adheres to the [AllExportsOutput](../src/tools/import-mapping/types/AllExportsOutput.ts) type. This type needs to contain all of the unique exported values for each package provided. Note: we will not be implementing this logic until later, so skip for now.

## Requirements and Process

Written in Typescript using clean, functional programming principles. Each function should have it's own file with it's own tests. All functions should use the [ErrorResult](../src/tools/import-mapping/types/ErrorResult.ts) type, similar to Go's return pattern. 

The process for evaluating each repo should be as follows: 

1. Parse the provided InputConfig checking that it adheres to the expected Type, alerting the user if not. 
2. Make sure there is an ignore list so that we will ignore build artifacts and node modules (dist, node_modulest, etc.)
3. Setup output maps that will contain the 
3. Create a function for looping over the provided repositories and then loops over each file in the repository. 
4. Create a function that accepts a file and loops over the provided packageNames to add the lines that contain "import" and the packageName to a list that is returned. Note we may need to accomodate for multi-line imports.
5. Create a function that accepts the list of import and packagename lines and parses them for the imported values name and the full package name. Note we should support all import syntaxes E.g. "import { val1, val2} ..." , "import * as val1 ..." and any permutation of the two. If using regex it must be simple and should be pulled into it's own function with enough test cases to validate it's functionality. Note the package names should support "packageName", "packageName/subfolder", etc. This function will return type Record<string, string[]> where the key is the packageName and the values are the imported values. 
6. Add the returned map from the previous function to the RepoPackagesOutput
7. Continue the loop for all the repos. 
8. Once the repos are finished repeat for the packages but make sure not to duplicate code as it's basically the same with a slightly different path. 
9. The final function will accept the RepoPackagesOutput and write that object to a json file. 

## Mock 

All functions should be tested against a mock setup see [mocks](../src/tools/import-mapping/__tests__/mocks) for the inputConfig.json file and folders. As you work add files and additional mock scenarios tot he mocks while keeping the inputConfig.json file up to date. 