import { assert } from 'chai';
import child from 'child_process';
import fs from 'fs';
import path from 'path';

const __dirname = path.join(process.cwd(), 'test');
const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')).toString());

const cliPath = path.resolve(__dirname, '../lib/cli.js');

describe('CLI', () => {
  let testPath;

  afterEach(() => {
    if (testPath) {
      try {
        fs.unlinkSync(testPath);
      }
      catch (err) {}

      testPath = null;
    }
  });

  it('converts JSON-Z to JSON from stdin to stdout', done => {
    const proc = child.spawn(process.execPath, [cliPath]);
    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{"$":100,"a":1,"b":2}');
      done();
    });

    fs.createReadStream(path.resolve(__dirname, 'test.jsonz')).pipe(proc.stdin);
  });

  it('reads from the specified file', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz')
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{"$":100,"a":1,"b":2}');
      done();
    });
  });

  it('indents output with the number of spaces specified', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-s',
        '4'
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{\n    "$": 100,\n    "a": 1,\n    "b": 2\n}');
      done();
    });
  });

  it('indents output with tabs when specified', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-s',
        't'
      ]
    );

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, '{\n\t"$": 100,\n\t"a": 1,\n\t"b": 2\n}');
      done();
    });
  });

  it('outputs to the specified file', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-o',
        testPath = path.resolve(__dirname, 'output.json')
      ]
    );

    proc.on('exit', () => {
      assert.strictEqual(
        fs.readFileSync(
          path.resolve(__dirname, 'output.json'),
          'utf8'
        ),
        '{"$":100,"a":1,"b":2}'
      );
      done();
    });
  });

  it('validates valid JSON-Z files', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'test.jsonz'),
        '-v'
      ]
    );

    proc.on('exit', code => {
      assert.strictEqual(code, 0);
      done();
    });
  });

  it('validates invalid JSON-Z files', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        path.resolve(__dirname, 'invalid.jsonz'),
        '-v'
      ]
    );

    let error = '';
    proc.stderr.on('data', data => {
      error += data;
    });

    proc.stderr.on('end', () => {
      if (error.includes('JSON-Z')) { // Strip away debug content, if any
        error = (/(JSON-Z.*?\n)/.exec(error) || [])[1];
      }

      assert.strictEqual(error, "JSON-Z: invalid character 'a' at 1:1\n");
    });

    proc.on('exit', code => {
      assert.strictEqual(code, 1);
      done();
    });
  });

  it('outputs the version number when specified', done => {
    const proc = child.spawn(process.execPath, [cliPath, '-V']);

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert.strictEqual(output, pkg.version + '\n');
      done();
    });
  });

  it('outputs usage information when specified', done => {
    const proc = child.spawn(process.execPath, [cliPath, '-h']);

    let output = '';
    proc.stdout.on('data', data => {
      output += data;
    });

    proc.stdout.on('end', () => {
      assert(/Usage/.test(output));
      done();
    });
  });

  it('is backward compatible with v0.5.1', done => {
    const proc = child.spawn(
      process.execPath,
      [
        cliPath,
        '-c',
        path.resolve(__dirname, 'test.jsonz')
      ]
    );

    proc.on('exit', () => {
      assert.strictEqual(
        fs.readFileSync(
          testPath = path.resolve(__dirname, 'test.json'),
          'utf8'
        ),
        '{"$":100,"a":1,"b":2}'
      );
      done();
    });
  });
});
