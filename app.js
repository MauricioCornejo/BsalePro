const express = require('express');
// const moment = require('moment/moment');
const app = express();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'postgres',
//     password: 'pg12345',
//     port: 5432
// });

//Prod 
// const pool = new Pool({
//     user: 'flores',
//     host: 'dpg-cjfaqnqnip6c739eemgg-a.ohio-postgres.render.com',
//     database: 'flores',
//     password: '2ozHMesEMGur2Fuuawl4LU2CnITcBCQx',
//     ssl: true,
//     port: 5432
// });

const pool = new Pool({
    user: 'spina-01',
    host: '34.176.172.225',
    database: 'spina',
    password: '##8YVldfv403$ts)',
    // ssl: true,
    port: 5432
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));



function formatAmount(number) {
    // Convertir el número a formato con separadores de miles
    const formattedNumber = number.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP'
    });

    return formattedNumber;
}

// Obtener registros de la base de datos
app.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        // let result = await client.query('SELECT * FROM flores.ventas');
        const data = [];
        const clientsResult = await client.query('SELECT * FROM flores.client WHERE status_activity = true');
        // const clientsResult = await client.query('SELECT * FROM flores.client');
        const clients = clientsResult.rows;

        const productsResult = await client.query('SELECT * FROM flores.product');
        const products = productsResult.rows;

        const salesResult = await client.query('SELECT * FROM flores.sale');
        const sales = salesResult.rows;
        // console.log(clients)
        data.clients = clients
        data.products = products
        data.sales = sales
        client.release();
        res.render('index', { data, clients, products, sales }); // Pasamos el array 'data' al renderizar la vista 'index.ejs'
        // res.render('index', {clients}); // Pasamos el array 'data' al renderizar la vista 'index.ejs'
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error al obtener los datos');
    }
});

// Agregar un registro (Mostrar modal de agregar)
app.get('/add', (req, res) => {
    res.render('add');
});

app.post('/add', async (req, res) => {
    try {
        const {
            cantidad_producto,
            sku_producto,
            id_cliente,
            precio_producto,
            total,
            fecha_venta,
            metodo_pago,
            nombre_producto,
            nombre_cliente,
            resto_venta,
            estado
        } = req.body;

        // Convierte los campos que contienen arreglos a arrays
        // const cantidadProductoArr = cantidad_producto.split(',').map(Number);
        // const skuProductoArr = sku_producto.split(',');
        // const precioProductoArr = precio_producto.split(',').map(Number);
        // const nombreProductoArr = nombre_producto.split(',');

        const client = await pool.connect();
        await client.query(
            `INSERT INTO flores.ventas 
            (id,cantidad_producto, sku_producto, id_cliente, precio_producto, total, fecha_venta, metodo_pago, nombre_producto, nombre_cliente, resto_venta, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                uuidv4(),
                cantidad_producto,
                sku_producto,
                id_cliente,
                precio_producto,
                total,
                fecha_venta,
                metodo_pago,
                nombre_producto,
                nombre_cliente,
                resto_venta,
                estado
            ]
        );

        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al agregar el registro:', error);
        res.status(500).send('Error al agregar el registro');
    }
});

// Editar un registro (Mostrar modal de editar)
app.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM flores.ventas WHERE id = $1', [id]);
        const venta = result.rows[0];
        client.release();
        // console.log('venta:', venta);
        res.json(venta); // Responder con el objeto venta en formato JSON
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        res.status(500).json({ error: 'Error al obtener el registro' }); // Responder con un objeto JSON en caso de error
    }
});

app.post('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad_producto, sku_producto, id_cliente, precio_producto, total, fecha_venta, metodo_pago, nombre_producto, nombre_cliente, resto_venta, estado } = req.body;
        const client = await pool.connect();
        await client.query(
            `UPDATE flores.ventas SET cantidad_producto = $1, sku_producto = $2, id_cliente = $3, precio_producto = $4, total = $5, fecha_venta = $6, metodo_pago = $7, nombre_producto = $8, nombre_cliente = $9, resto_venta = $10, estado = $11 WHERE id = $12`,
            [cantidad_producto, sku_producto, id_cliente, precio_producto, total, fecha_venta, metodo_pago, nombre_producto, nombre_cliente, resto_venta, estado, id]
        );
        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al editar el registro:', error);
        res.status(500).send('Error al editar el registro');
    }
});

// Eliminar un registro (Mostrar modal de eliminar)
app.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        await client.query(`DELETE FROM flores.ventas WHERE id = $1`, [id]);
        client.release();
        res.json({ success: true });
    } catch (error) {
        const { id } = req.params;
        console.error('Error al eliminar el registro:', error, [id]);
        res.status(500).json({ success: false, message: 'Error al eliminar el registro' });
    }
});


/****************************************************************** */
/* Sales */
/****************************************************************** */


app.post('/add_sale', async (req, res) => {
    try {
        console.log(req.body)
        const {
            products,
            sales_date,
            id_client_select,
            status_sale,
            payment_method,
            amount_paid,
        } = req.body;
        let total_amount = 0;
        products.forEach(product => {
            total_amount+= Number(product.subTotal)
        });

        // const ticket_number = 0;
        const amount_paid_formated = formatAmount(Number(amount_paid))
        const total_amount_formated = formatAmount(Number(total_amount))
        // console.log("productos add sale  ===>", products);
        const client = await pool.connect();
        await client.query(
            `INSERT INTO flores.sale
            (id, products, date, id_client, status, payment_method, amount_paid, amount_paid_formated, seller_name, total_amount, total_amount_formated) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                uuidv4(),
                // ticket_number,
                products,
                sales_date,
                id_client_select,
                status_sale,
                payment_method,
                amount_paid,
                amount_paid_formated,
                "seller_name",
                total_amount,
                total_amount_formated
            ]
        );
        client.release();
        res.json({ success: true });
    } catch (error) {
        console.error('Error al agregar el registro:', error);
        res.status(500).send('Error al agregar el registro');
    }
});

// Editar un registro (Mostrar modal de editar)
app.get('/sales', async (req, res) => {
    try {
        // console.log("******************* LLEGUE AL get Sales")
        // const { id } = req.params;
        const client = await pool.connect();
        // const resultSearch = await client.query('SELECT id, ticket_number, products, date, id_client, status, payment_method, amount_paid, amount_paid_formated, seller_name, total_amount, total_amount_formated FROM flores.sale');

        // const resultSearch = await client.query('SELECT  * FROM flores.sale s JOIN flores.client c ON s.id_client = c.id ');
        // const resultSearch = await client.query('SELECT client.name, sale.id, sale.products, sale.date, sale.status, sale.payment_method, sale.amount_paid, sale.amount_paid_formated, sale.seller_name, sale.total_amount, sale.total_amount_formated, sale.ticket_number FROM client JOIN sale ON client.id = sale.id_client');

        const resultSearch = await client.query('SELECT flores.client.name, sale.id, sale.products, sale.date, sale.status, sale.payment_method, sale.amount_paid, sale.amount_paid_formated, sale.seller_name, sale.total_amount, sale.total_amount_formated, sale.ticket_number FROM flores.client JOIN flores.sale ON flores.client.id = flores.sale.id_client');

        const salesSearch = resultSearch.rows;
        client.release();
        // console.log('resultSearch sales:', salesSearch);
        res.json({ data: salesSearch }); // Responder con el objeto venta en formato JSON
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        res.status(500).json({ error: 'Error al obtener el registro' }); // Responder con un objeto JSON en caso de error
    }
});

// Eliminar un registro (Mostrar modal de eliminar)
app.delete('/delete_sale/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect(); 
        // console.log("el id a eliminar", id)
        await client.query(`DELETE FROM flores.sale WHERE id = $1`, [id]);
        client.release();
        res.json({ success: true });
    } catch (error) {
        const { id } = req.params;
        console.error('Error al eliminar el registro:', error, [id]);
        res.status(500).json({ success: false, message: 'Error al eliminar el registro' });
    }
});

// Editar un registro (Mostrar modal de editar)
app.get('/edit_sale/:id', async (req, res) => {
    try {
        // console.log("******************* LLEGUE AL EDIT SALEEE GET")
        const { id } = req.params;
        const client = await pool.connect();
        const resultSearch = await client.query('SELECT * FROM flores.sale WHERE id = $1', [id]);
        const salesSearch = resultSearch.rows[0];
        client.release();
        // console.log('resultSearch:', resultSearch.rows[0]);
        // res.render('edit_client/:id');
        res.json(salesSearch); // Responder con el objeto venta en formato JSON
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        res.status(500).json({ error: 'Error al obtener el registro' }); // Responder con un objeto JSON en caso de error
    }
});

// edit sale
app.post('/edit_sale/:id', async (req, res) => {
    try {

        const { id } = req.params;
        const { products,
            sales_date,
            id_client_select,
            status_sale,
            payment_method,
            total_amount,
            amount_paid
        } = req.body;

        // console.log("*****************LLEGUE AL POST EDITAR  sale  ************************************")
        // console.log(req.body)
        // console.log(id)
        const amount_paid_formated = formatAmount(Number(amount_paid))
        const total_amount_formated = formatAmount(Number(total_amount))

        console.log(amount_paid_formated)
        console.log(total_amount_formated)
        const client = await pool.connect();
        await client.query(
            `UPDATE flores.sale SET products = $1, date = $2, id_client = $3, status = $4, payment_method = $5, amount_paid = $6, amount_paid_formated = $7, total_amount = $8, total_amount_formated = $9 WHERE id = $10`,
            [products,
                sales_date,
                id_client_select,
                status_sale,
                payment_method,
                amount_paid,
                amount_paid_formated,
                total_amount,
                total_amount_formated,
                id]
        );
        client.release();
        // res.redirect('/');
        res.json({ success: true });
       
    } catch (error) {
        console.error('Error al editar el registro:', error);
        res.status(500).send('Error al editar el registro');
    }
});






/****************************************************************** */
/* Clients */
/****************************************************************** */
// Obtener registros de cliente la base de datos
app.get('/client', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM flores.cliente WHERE status_activity = true');
        const clients = result.rows;
        client.release();
        res.render('index', { clients }); // Pasamos el array 'data' al renderizar la vista 'index.ejs'
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error al obtener los datos');
    }
});
// Add clients
app.post('/add_client', async (req, res) => {
    try {
        const {
            client_name,
            client_rut,
            client_email,
            cell_phone,
            client_address,
        } = req.body;
        // console.log("nOMBRE DLE CLIENMTE ****** ", client_name)
        const client = await pool.connect();
        await client.query(
            `INSERT INTO flores.client
            (id, name, rut, email, cell_phone, address) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                uuidv4(),
                client_name,
                client_rut,
                client_email,
                cell_phone,
                client_address,
            ]
        );
        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al agregar el registro de cliente:', error);
        res.status(500).send('Error al agregar el registro');
    }
});

// Editar un registro (Mostrar modal de editar)
app.get('/edit_client/:id', async (req, res) => {
    try {
        // console.log("******************* LLEGUE AL EDIT CLIENT GET")
        const { id } = req.params;
        const client = await pool.connect();
        const resultSearch = await client.query('SELECT * FROM flores.client WHERE id = $1', [id]);
        const clientsSearch = resultSearch.rows[0];
        client.release();
        // console.log('resultSearch:', resultSearch.rows[0]);
        // res.render('edit_client/:id');
        res.json(clientsSearch); // Responder con el objeto venta en formato JSON
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        res.status(500).json({ error: 'Error al obtener el registro' }); // Responder con un objeto JSON en caso de error
    }
});

// edit client
app.post('/edit_client/:id', async (req, res) => {
    try {

        const { id } = req.params;
        const { client_name,
            client_rut,
            client_email,
            cell_phone,
            client_address
        } = req.body;
        // console.log(req.body)
        // console.log("*****************LLEGUE AL POST EDITAR ************************************")
        const client = await pool.connect();
        await client.query(
            `UPDATE flores.client SET name = $1, rut = $2, email = $3, cell_phone = $4, address = $5 WHERE id = $6`,
            [client_name,
                client_rut,
                client_email,
                cell_phone,
                client_address,
                id]
        );
        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al editar el registro:', error);
        res.status(500).send('Error al editar el registro');
    }
});

// Eliminar un registro (Mostrar modal de eliminar)
app.delete('/delete_client/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        const status_activity = false;
        // await client.query(`DELETE FROM flores.client WHERE id = $1`, [id]);
        await client.query(`UPDATE flores.client SET status_activity =$1  WHERE id = $2`, [status_activity, id]);
        client.release();
        res.json({ success: true });
    } catch (error) {
        const { id } = req.params;
        console.error('Error al eliminar el registro:', error, [id]);
        res.status(500).json({ success: false, message: 'Error al eliminar el registro' });
    }
});

/****************************************************************** */
/* PRODUCTS */
/****************************************************************** */

app.post('/add_product', async (req, res) => {
    try {
        const {
            sku_product,
            name_product,
            cost_product,
            type_product,
            stock,
            variant,
            measurement
        } = req.body;
        const cost_formated = new Intl.NumberFormat().format((Number(cost_product)).toFixed(2)).replace(',', '.')
        const stock_formated = new Intl.NumberFormat().format((Number(stock)).toFixed(2)).replace(',', '.')
        // console.log("AGREGAR PRODUCTO", req.body)
        const client = await pool.connect();
        await client.query(
            `INSERT INTO flores.product 
            ( id, sku, name, cost, stock, type, variant, measurement, is_active, cost_formated, stock_formated) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                uuidv4(),
                sku_product,
                name_product,
                cost_product,
                stock,
                type_product,
                variant,
                measurement,
                true,
                cost_formated,
                stock_formated
            ]
        );
        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al agregar el registro de producto:', error);
        res.status(500).send('Error al agregar el registro');
    }
});

// Editar un registro (Mostrar modal de editar)
app.get('/edit_product/:id', async (req, res) => {
    try {
        // console.log("******************* LLEGUE AL EDIT product GET")
        const { id } = req.params;
        const client = await pool.connect();
        const resultSearch = await client.query('SELECT * FROM flores.product WHERE id = $1', [id]);
        const clientsSearch = resultSearch.rows[0];
        client.release();
        // console.log('resultSearch product:', resultSearch.rows[0]);
        // res.render('edit_client/:id');
        res.json(clientsSearch); // Responder con el objeto venta en formato JSON
    } catch (error) {
        console.error('Error al obtener el registro:', error);
        res.status(500).json({ error: 'Error al obtener el registro' }); // Responder con un objeto JSON en caso de error
    }
});

// edit product
app.post('/edit_product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { sku_product,
            name_product,
            cost_product,
            type_product,
            stock,
            variant,
            measurement
        } = req.body;
        const cost_formated = new Intl.NumberFormat().format((Number(cost_product)).toFixed(2)).replace(',', '.')
        const stock_formated = new Intl.NumberFormat().format((Number(stock)).toFixed(2)).replace(',', '.')
        // console.log("*****************LLEGUE AL POST EDITAR ************************************")
        const client = await pool.connect();
        await client.query(
            `UPDATE flores.product SET sku = $1, name = $2, cost = $3, type = $4, stock = $5, variant = $6, measurement = $7, cost_formated = $8, stock_formated = $9 WHERE id = $10`,
            [sku_product,
                name_product,
                cost_product,
                type_product,
                stock,
                variant,
                measurement,
                cost_formated,
                stock_formated,
                id]
        );
        client.release();
        res.redirect('/');
    } catch (error) {
        console.error('Error al editar el registro:', error);
        res.status(500).send('Error al editar el registro');
    }
});

// Eliminar un registro de producto (Mostrar modal de eliminar)
app.delete('/delete_product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await pool.connect();
        await client.query(`DELETE FROM flores.product WHERE id = $1`, [id]);
        client.release();
        res.json({ success: true });
    } catch (error) {
        const { id } = req.params;
        console.error('Error al eliminar el registro:', error, [id]);
        res.status(500).json({ success: false, message: 'Error al eliminar el registro' });
    }
});






app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});



