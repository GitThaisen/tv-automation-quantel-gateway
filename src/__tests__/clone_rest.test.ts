/*
	 Copyright (c) 2019 Norsk rikskringkasting AS (NRK)

	 This file is part of Sofie: The Modern TV News Studio Automation
	 System (Quantel gateway)

	 This program is free software; you can redistribute it and/or modify
	 it under the terms of the GNU General Public License as published by
	 the Free Software Foundation; either version 2 of the License, or
	 (at your option) any later version.

	 This program is distributed in the hope that it will be useful,
	 but WITHOUT ANY WARRANTY; without even the implied warranty of
	 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	 GNU General Public License for more details.

	 You should have received a copy of the GNU General Public License along
	 with this program; if not, write to the Free Software Foundation, Inc.,
	 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { Quantel } from '../index'
import * as spawn from './spawn_server'
import { app } from '../server'
import { Server } from 'http'
import * as request from 'request-promise-native'

describe('Copy-level REST API tests', () => {

	let isaIOR: string
	let server: Server

	beforeAll(async () => {
		isaIOR = await spawn.start()
		await new Promise((resolve, reject) => {
			server = app.listen(3000) // TODO change this to a config parameter
			server.on('listening', () => {
				resolve()
			})
			server.on('error', e => {
				reject(e)
			})
		})
	})

	test('Test connect', async () => {
		await expect(request.post('http://localhost:3000/connect/127.0.0.1').then(JSON.parse))
		.resolves.toStrictEqual({
			type: 'ConnectionDetails',
			href: 'http://127.0.0.1:2096',
			isaIOR,
		 	refs: [ 'http://127.0.0.1:2096' ],
			robin: 0 } as Quantel.ConnectionDetails)
	})

	test('Clone clip inter-zone with history', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321
			} as Quantel.CloneInfo,
			json: true }))
		.resolves.toMatchObject({
			type: 'CloneResult',
			zoneID: 1000,
			clipID: 1234,
			poolID: 4321,
			priority: 8,
			history: true,
			copyCreated: true,
			copyID: 421
		} as Quantel.CloneResult)
	})

	test('Clone clip inter-zone without history', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				history: false
			} as Quantel.CloneInfo,
			json: true }))
		.resolves.toMatchObject({
			type: 'CloneResult',
			zoneID: 1000,
			clipID: 1234,
			poolID: 4321,
			priority: 8,
			history: false,
			copyCreated: true,
			copyID: 422
		} as Quantel.CloneResult)
	})

	test('Clone within zone', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				clipID: 1234,
				poolID: 4321,
				priority: 15
			} as Quantel.CloneInfo,
			json: true }))
		.resolves.toMatchObject({
			type: 'CloneResult',
			clipID: 1234,
			poolID: 4321,
			priority: 15,
			history: true,
			copyCreated: true,
			copyID: 423
		} as Quantel.CloneResult)
	})

	test('Attempt to clone with a string zone ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 'wtf',
				clipID: 1234,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('Where present, a clone request must use a positive integer for the zone ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 'wtf',
				clipID: 1234,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a negative zone ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: -42,
				clipID: 1234,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('Where present, a clone request must use a positive integer for the zone ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: -42,
				clipID: 1234,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a string clip ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 'wtf',
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('A clone request must have a positive integer for the source clip ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 'wtf',
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a negative clip ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: -321,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('A clone request must have a positive integer for the source clip ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: -321,
				poolID: 4321,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a string pool ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 'wtf',
				priority: 15
			},
			json: true }))
		.rejects.toThrow('A clone request must have a positive integer for the destiniation pool ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 'wtf',
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a negative pool ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: -1,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('A clone request must have a positive integer for the destiniation pool ID')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: -1,
				priority: 15
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a string priority', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 'wtf'
			},
			json: true }))
		.rejects.toThrow('A clone request with priority specified must use an integer in the range 0 to 15')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 'wtf'
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a negative priority', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: -1
			},
			json: true }))
		.rejects.toThrow('A clone request with priority specified must use an integer in the range 0 to 15')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: -1
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with a over-range priority', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 16
			},
			json: true }))
		.rejects.toThrow('A clone request with priority specified must use an integer in the range 0 to 15')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 16
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone with bad history parameter', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 15,
				history: 'wtf'
			},
			json: true }))
		.rejects.toThrow('A history parameter for a clone request must be either \'true\' or \'false\'.')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 4321,
				priority: 16,
				history: 'wtf'
			},
			json: true }))
		.rejects.toThrow('400')
	})

	test('Attempt to clone clip with bad zone ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 666,
				clipID: 1234,
				poolID: 4321
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('One of the source clip ID \'1234\', source zone ID \'666\' or destiniation pool ID \'4321\' was not found.')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 666,
				clipID: 1234,
				poolID: 4321
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('404')
	})

	test('Attempt to clone clip with bad clip ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 666,
				poolID: 4321
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('One of the source clip ID \'666\', source zone ID \'1000\' or destiniation pool ID \'4321\' was not found.')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 666,
				poolID: 4321
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('404')
	})

	test('Attempt to clone clip with bad pool ID', async () => {
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 666
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('One of the source clip ID \'1234\', source zone ID \'1000\' or destiniation pool ID \'666\' was not found.')
		await expect(request({
			method: 'POST',
			uri: 'http://localhost:3000/default/copy',
			body: {
				zoneID: 1000,
				clipID: 1234,
				poolID: 666
			} as Quantel.CloneInfo,
			json: true }))
		.rejects.toThrow('404')
	})

	test('Copy remaining', async () => {
		await expect(request.get('http://localhost:3000/default/copy/42').then(JSON.parse))
		.resolves.toMatchObject({
			type: 'CopyProgress',
			clipID: 42,
			protonsLeft: 128,
			totalProtons: 256,
			secsLeft: 19,
			priority: 9,
			ticketed: false
		} as Quantel.CopyProgress)
	})

	test('Attempt to get copy remaining, non-integer ident', async () => {
		await expect(request.get('http://localhost:3000/default/copy/wtf'))
		.rejects.toThrow('Copy ID is a clip ID that must be a positive integer')
		await expect(request.get('http://localhost:3000/default/copy/wtf'))
		.rejects.toThrow('400')
	})

	test('Attempt to get copy remaining, negative ident', async () => {
		await expect(request.get('http://localhost:3000/default/copy/-7'))
		.rejects.toThrow('Copy ID is a clip ID that must be a positive integer')
		await expect(request.get('http://localhost:3000/default/copy/-7'))
		.rejects.toThrow('400')
	})

	test('Attempt to get copy remaining, no copy record', async () => {
		await expect(request.get('http://localhost:3000/default/copy/666'))
		.rejects.toThrow('A copy associated with clip ID \'666\' was not found.')
		await expect(request.get('http://localhost:3000/default/copy/666'))
		.rejects.toThrow('404')
	})

	test('Copies remaining', async () => {
		await expect(request.get('http://localhost:3000/default/copy/').then(JSON.parse))
		.resolves.toMatchObject([{
			type: 'CopyProgress',
			clipID: 42,
			protonsLeft: 128,
			totalProtons: 256,
			secsLeft: -3,
			priority: 9,
			ticketed: false
		}] as Quantel.CopyProgress[])
	})

	afterAll(async () => {
		Quantel.destroyOrb()
		await new Promise((resolve, reject) => {
			server.close(e => {
				if (e) {
					reject(e)
				} else { resolve() }
			})
		})
		await spawn.stop()
	})
})
