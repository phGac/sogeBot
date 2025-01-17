require('../../general.js');

const assert = require('assert');
const { AppDataSource } = require('../../../dest/database.js');

const { Cooldown } = require('../../../dest/database/entity/cooldown');
const { Price } = require('../../../dest/database/entity/price');
const { User } = require('../../../dest/database/entity/user');
const Parser = require('../../../dest/parser').default;
const cooldown = (require('../../../dest/systems/cooldown')).default;
const db = require('../../general.js').db;
const message = require('../../general.js').message;
const user = require('../../general.js').user;
const time = require('../../general.js').time;

describe('Cooldowns - @func3 - #3720 - global cooldown should be properly reverted', () => {
  before(async () => {
    await db.cleanup();
    await message.prepare();
    await user.prepare();

    await AppDataSource.getRepository(User).save({ ...user.viewer2, points: 100 });
  });

  it('create cooldown on !me [global 60]', async () => {
    const [command, type, seconds, quiet] = ['!me', 'global', '5', true];
    const r = await cooldown.main({ sender: user.owner, parameters: `${command} ${type} ${seconds} ${quiet}` });
    assert.strictEqual(r[0].response, '$sender, global cooldown for !me was set to 5s');
  });

  it('check if cooldown is created', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    assert(item);
    timestamp = item.timestamp;
  });

  it('testuser should be able to use !me', async () => {
    const parse = new Parser({ sender: user.viewer, message: '!me', skip: false, quiet: false });
    await parse.process();
  });

  it('save timestamp', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    assert(item);
    timestamp = item.timestamp;
  });

  it('add price for !me', async () => {
    await AppDataSource.getRepository(Price).save({ command: '!me', price: '100' });
  });

  it('wait 6s to cool off cooldown', async() => {
    await time.waitMs(6000);
  });

  it('testuser should not have enough points', async () => {
    const parse = new Parser({ sender: user.viewer, message: '!me', skip: false, quiet: false });
    await parse.process();
  });

  it('cooldown should be reverted', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    assert.strictEqual(item.timestamp, new Date(0).toISOString());
  });

  it('testuser2 should have enough points', async () => {
    const parse = new Parser({ sender: user.viewer2, message: '!me', skip: false, quiet: false });
    await parse.process();
  });

  let timestamp = 0;
  it('cooldown should be changed', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    timestamp = item.timestamp;
    assert(new Date(item.timestamp).getTime() > 0);
  });

  it('testuser2 should not have enough points', async () => {
    const parse = new Parser({ sender: user.viewer2, message: '!me', skip: false, quiet: false });
    await parse.process();
  });

  it('cooldown should be not changed (still on cooldown period)', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    assert.strictEqual(item.timestamp, timestamp);
  });

  it('wait 6s to cool off cooldown', async() => {
    await time.waitMs(6000);
  });

  it('testuser2 should not have enough points', async () => {
    const parse = new Parser({ sender: user.viewer2, message: '!me', skip: false, quiet: false });
    await parse.process();
  });

  it('cooldown should be reverted', async () => {
    const item = await AppDataSource.getRepository(Cooldown).findOne({ where: { name: '!me' } });
    assert.strictEqual(item.timestamp, new Date(0).toISOString());
  });
});
