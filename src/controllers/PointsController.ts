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
            .select('points.*')
            .distinct()
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .modify(function (queryBuilder) {
                if (city != '') {
                    queryBuilder.where('city', 'like', `%${String(city)}%`);
                }
                if (uf != '') {
                    queryBuilder.where('uf', String(uf));
                }
                if (items != '') {
                    queryBuilder.whereIn('point_items.item_id', parsedItems);
                }
            });

        const serializedPoints = points.map((point: any) => {
            return {
                ...point,
                image_url: `http://localhost:3333/uploads/points/${point.image}`,
            };
        });

        return response.json(serializedPoints);

    }

    /** Show a Points */
    async show(request: Request, response: Response) {

        const { id } = request.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return response.status(400).json({ message: 'Point not found!'});
        }

        const serializedPoints = {
            ...point,
            image_url: `http://localhost:3333/uploads/points/${point.image}`,
        };

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');

        return response.json({ point: serializedPoints, items });
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
            image: request.file.filename,
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

        const pointItems = items
            .split(',')
            .map((item: string) => Number(item.trim()))
            .map((item_id: number) => {
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
