### BLOATY METRICS

Simple library for recording custom in-app metrics.

Short-term metrics are stored in memory using [node-cache](https://github.com/node-cache/node-cache), and saved to a postgres datastore on a specified interval using [typeorm](https://typeorm.io/).

Likely not the most resource-efficient and optimal solution, but it works for my needs - hence 'bloaty-metrics'.

Set up for use with postgres datastore, but could be modified easily to work with other data stores (bc of typeorm).

install with

`npm i bloaty-metrics`

See examples in the test dir
