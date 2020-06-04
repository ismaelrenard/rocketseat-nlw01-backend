import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {

    /** List of Points */
    async index(request: Request, response: Response) {

        const { city, uf, items } = request.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', 'like', `%${String(city)}%`)
            .where('uf', String(uf))
            .distinct()
            .select('points.*')

        return response.json(points);

    }

    /** Show a Points */
    async show(request: Request, response: Response) {

        const { id } = request.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return response.status(400).json({ message: 'Point not found!'});
        }

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');

        return response.json({ point, items });
    }

    /** Create a Points */
    async create(request: Request, response: Response) {

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;

        const knexTrx = await knex.transaction();

        const point = {
            image: 'image-fake',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const insertedPointId = await knexTrx('points').insert(point);

        const point_id = insertedPointId[0];

        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id,
            };
        });

        await knexTrx('point_items').insert(pointItems);

        await knexTrx.commit();

        return response.json({
            id: point_id,
            ...point
        });
    }
}

export default PointsController;