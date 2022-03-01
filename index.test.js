const postcss = require('postcss')

const plugin = require('./')

async function run (input, output, opts = { }) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

it('should convert justify-content: space-evenly', async () => {
  await run('a{justify-content: space-evenly;}', 'a{justify-content: space-between;}\n' +
  'a:after{content: "";display: block;}\n' +
  'a:before{content: "";display: block;}', { })
})

it('should convert grid-template-columns', async () => {
  await run('a{grid-template-columns: repeat(5,1fr);}', 'a{grid-template-columns: repeat(5,1fr);display: flex;flex-wrap: wrap;}\n' +
  'a > *{flex: 1 0 20%;}', { })
})

it('should convert grid-gap', async () => {
  await run('a{grid-gap: 0.5rem;}a>*{width: 25%;}', 'a{grid-gap: 0.5rem;margin-left: -1rem;}a > *{margin-left: 1rem;margin-bottom: 1rem;}a>*{width: 25%;}', { })
})

it('should convert gap', async () => {
  await run('a{gap: 3em;}a b{height: 3em;width: 9rem;}', 'a{}a > *{margin: 1.5em;}a b{height: 3em;width: calc(9rem - 3em);}', { })
})