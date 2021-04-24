const express = require('express');
const conversion = express.Router();
const mysqlConnection = require('../database');

//CRUD de conversions 
/*
CREATE ENDPOINTS:

1) Crear un conversion 

2) Crear la relacion modifiable_conversion_attribute (equivalente a 'asociarse' a un sensor para un player)

*/

//1)Crea una conversion 
//WORKS
conversion.post('/conversion',(req,res,next)=>{
    var sensorData = req.body
    var insertInto = 'INSERT INTO `conversion` '
    var columnValues = '(`name`,`description`,`operations`, `initiated_date`, `last_modified`) '
    var date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    console.log(typeof(date))
    var newValues = 'VALUES (?,?,?,' + '\''+date +'\''+ ',' + '\''+date + '\''+')'
    var query = insertInto+columnValues+newValues
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[sensorData.name,sensorData.description,sensorData.operations], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json(rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
        
})
//2)Crea una relacion modifiable_conversion_attribute
//WORKS
conversion.post('/modifiable_conversion_attribute',(req,res,next)=>{
    var relation_data = req.body
    var insertInto = 'INSERT INTO `modifiable_conversion_attribute` '
    var columnValues = '(`id_attributes`,`id_conversion`,`id_modifiable_mechanic`) '
    var newValues = 'VALUES (?,?,?)'
    var query = insertInto+columnValues+newValues
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[relation_data.id_attributes,relation_data.id_conversion,relation_data.id_modifiable_mechanic], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json(rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})
/*
RETRIEVE CONVERSION:

1) Obtener un conversion en particular 

2) Obtener TODAS las conversion en particular 

3) Obtener TODOS las conversiones relacionados a un sensor_endpoint y los parametros que cambiaron

4) Obtener TODOS las conversiones relacionados a atributos y una mecanica en especial

*/

//1) Obtener un conversion en particular
//WORKS
conversion.get('/conversion/:id_conversion',(req,res,next)=>{
    var id_conversion = req.params.id_conversion
    var select = 'SELECT `conversion`.`name`, `conversion`.`description`, `conversion`.`operations`, `conversion`.`initiated_date`, `conversion`.`last_modified` '
    var from = ' FROM `conversion` '
    var where = 'WHERE `conversion`.`id_conversion` = ?'
    var query = select+from+join
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[id_conversion], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json(rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})

//1) Obtener TODAS las conversion en particular 
//WORKS
conversion.get('/conversions_all',(res,next)=>{
    var select = 'SELECT `conversion`.`name`, `conversion`.`description`, `conversion`.`operations`, `conversion`.`initiated_date`, `conversion`.`last_modified` '
    var from = ' FROM `conversion` '
    var query = select+from+join
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query, function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json(rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})

//3) Obtener TODOS las conversiones relacionados a un sensor_endpoint y los parametros que cambiaron
/*

   var dataChanges ={  
        "id_sensor_endpoint": id_sensor_endpoint, Ej: 5
        "parameters_watched":changedParameters  Ej: ['chess_blitz,records,win', 'elo','puzzle_challenge,record']                                     
    }
    SELECT
    `conversion`.`id_conversion`,
    `conversion`.`id_subattributes`,
    `conversion`.`operations`
FROM
    `conversion`
JOIN `conversion_sensor_endpoint` ON `conversion`.`id_conversion` = `conversion_sensor_endpoint`.`id_conversion`
WHERE
    `conversion_sensor_endpoint`.`id_sensor_endpoint` = 2 AND `conversion`.`parameters_watched` IN ('followers')

*/
conversion.post('/conversions',(req,res,next)=>{
    console.log(req)
    console.log(req.body.id_sensor_endpoint)
    console.log(req.body.parameters_watched)
    var id_sensor_endpoint = req.body.id_sensor_endpoint;
    var parameters_watched = req.body.parameters_watched;
    if(id_sensor_endpoint === undefined || parameters_watched === null){
        res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
    }
    var stringAux = ""
    var acum = ""
    var formatted = []
    for (const parameter of parameters_watched) {
        //Ej parameters_watched =  [['finished','win'], ['elo'],['puzzle_challenge','record','true'],['puzzle_rush'],['chess_rapid','0','record','win']]
        //Ej parameter = ['finished','win']
        for (let index = 0; index < parameter.length-1; index++) {
            acum += parameter[index]+",";
        }
        acum += parameter[parameter.length-1];
        formatted.push(acum)
        acum = ''        
    }

    for (let index = 0; index < formatted.length-1; index++) {
        stringAux += '\''+formatted[index]+'\''+",";
    }
    stringAux += '\''+formatted[formatted.length-1]+'\'';

    console.log('Este es el resultado')
    console.log(stringAux)

    var select = 'SELECT `subattributes_conversion_sensor_endpoint`.`id_conversion`, `subattributes_conversion_sensor_endpoint`.`id_subattributes`, `conversion`.`operations` '
    var from = 'FROM `conversion` '
    var join = 'JOIN `subattributes_conversion_sensor_endpoint` ON `conversion`.`id_conversion` = `subattributes_conversion_sensor_endpoint`.`id_conversion`'
    var where = 'WHERE `subattributes_conversion_sensor_endpoint`.`id_sensor_endpoint` = ? AND `subattributes_conversion_sensor_endpoint`.`parameters_watched` IN ('+stringAux+')' 
    var query = select+from+join+where
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[id_sensor_endpoint], function(err,rows,fields){
            if (!err){
                console.log(rows);
                var id_conversions = []
                var id_subattributes = []
                var operations = []
                rows.forEach(result => {
                    id_conversions.push(result.id_conversion)
                    id_subattributes.push(result.id_subattributes)
                    operations.push(result.operations)                
                });
    
                res.status(200).json({"id_conversions": id_conversions, "id_subattributes": id_subattributes, "operations": operations} )
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })

})

//4) Obtener TODOS las conversiones relacionados a atributos y una mecanica en especial

conversion.get('/conversion_spend_attribute/:id_videogame/:id_modifiable_mechanic',(req,res,next)=>{
    console.log(req)
    console.log(req.params.id_videogame)
    console.log(req.params.id_modifiable_mechanic)
    var id_videogame = req.params.id_videogame;
    var id_modifiable_mechanic = req.params.id_modifiable_mechanic;
    if(id_videogame === undefined || id_modifiable_mechanic === undefined){
        res.status(400).json({"message": "Body lacks information"} )
    }
    var select = 'SELECT `modifiable_conversion_attribute`.`id_conversion`, `modifiable_conversion_attribute`.`id_attributes`, `modifiable_mechanic_videogame`.`options`,`conversion`.`operations` '
    var from = 'FROM `videogame` '
    var join = 'JOIN `modifiable_mechanic_videogame` ON `videogame`.`id_videogame` = `modifiable_mechanic_videogame`.`id_videogame`  JOIN `modifiable_mechanic` ON `modifiable_mechanic`.`id_modifiable_mechanic` = `modifiable_mechanic_videogame`.`id_modifiable_mechanic` '
    var join2 = 'JOIN `modifiable_conversion_attribute` ON `modifiable_conversion_attribute`.`id_modifiable_mechanic` = `modifiable_mechanic`.`id_modifiable_mechanic` JOIN `attributes` ON `attributes`.`id_attributes` = `modifiable_conversion_attribute`.`id_attributes` '
    var join3 = 'JOIN `conversion` ON `conversion`.`id_conversion` = `modifiable_conversion_attribute`.`id_conversion` '

    var where = 'WHERE `videogame`.`id_videogame` = ? AND `modifiable_mechanic_videogame`.`id_videogame` = ? ' 
    var and = 'AND `modifiable_mechanic`.`id_modifiable_mechanic` = ? AND `modifiable_conversion_attribute`.`id_modifiable_mechanic` = ?' 
    var query = select+from+join+join2+join3+where+and
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[id_videogame,id_videogame,id_modifiable_mechanic,id_modifiable_mechanic], function(err,rows,fields){
            if (!err){
                console.log(rows)
                var id_conversion = []
                var id_attributes = []
                var operations = []
                var options = []
    
                rows.forEach(result => {
                    id_conversion.push(result.id_conversion)
                    id_attributes.push(result.id_attributes)
                    operations.push(result.operations)    
                    options.push(result.options)                
                
                });
    
    
                res.status(200).json({"id_conversion": id_conversion, "id_attributes": id_attributes, "operations": operations,"options": options} )
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })

})


//UPDATE ENDPOINTS:
//3) Modificar una conversion en especial (name, description, operation)
//WORKS
conversion.put('/conversion/:id_conversion',(req,res,next)=>{

    var id_conversion = req.params.id_conversion
    var new_conversion_data = req.body

    var date = new Date().toISOString().slice(0, 19).replace('T', ' ')

    var update = 'UPDATE `conversion`'
    var set = ' SET `name` = ?,`description` = ? ,`operations` = ?, `last_modified` = ' + '\''+date+'\'' 
    var where = ' WHERE `conversion`.`id_conversion` = ?'
    var query = update+set+where    
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[new_conversion_data.name,new_conversion_data.description,new_conversion_data.operation,id_conversion], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json( rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})

//2) Modificar una relacion conversion atributo y mecanica en especial (id_attributes, id_conversion, id_modifiable_mechanic)
//WORKS
conversion.put('/modifiable_conversion_attribute/:id_attributes/:id_conversion/:id_modifiable_mechanic',(req,res,next)=>{
    var relation_body = req.body

    var id_attributes = req.params.id_attributes
    var id_conversion = req.params.id_conversion
    var id_modifiable_mechanic = req.params.id_modifiable_mechanic

    var update = 'UPDATE `modifiable_conversion_attribute` '
    var set = ' SET `id_attributes` = ?, `id_conversion` = ?, `id_modifiable_mechanic` = ? ' 
    var where = ' WHERE `modifiable_conversion_attribute`.`id_attributes` = ? AND `modifiable_conversion_attribute`.`id_conversion` = ? '
    var and = 'AND `modifiable_conversion_attribute`.`id_modifiable_mechanic` = ?'
    var query = update+set+where+and    
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[relation_body.id_attributes,relation_body.id_conversion,relation_body.id_modifiable_mechanic, id_attributes,id_conversion, id_modifiable_mechanic], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json( rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})

//DELETE ENDPOINTS:
conversion.delete('/conversion/:id_conversion',(req,res,next)=>{

    var id_conversion = req.params.id_conversion


    var deleteD = 'DELETE FROM `conversion` '
    var where = 'WHERE `conversion`. id_conversion = ? '
    var query = deleteD+where    
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[id_conversion], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json( rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})
conversion.delete('/modifiable_conversion_attribute/:id_attributes/:id_conversion/:id_modifiable_mechanic',(req,res,next)=>{

    var id_attributes = req.params.id_attributes
    var id_conversion = req.params.id_conversion
    var id_modifiable_mechanic = req.params.id_modifiable_mechanic


    var deleteD = 'DELETE FROM `modifiable_conversion_attribute` '
    var where = 'WHERE `modifiable_conversion_attribute`. id_conversion = ? '
    var and = 'AND `modifiable_conversion_attribute`.`id_attributes` = ? AND `modifiable_conversion_attribute`.`id_modifiable_mechanic` = ? '
    var query = deleteD+where+and
    mysqlConnection.getConnection(function(err, connection) {
        if (err){
            res.status(400).json({message:'No se pudo obtener una conexion para realizar la consulta en la base de datos, consulte nuevamente', error: err})
            throw err
        } 
        connection.query(query,[id_conversion,id_attributes,id_modifiable_mechanic], function(err,rows,fields){
            if (!err){
                console.log(rows);
                res.status(200).json( rows)
            } else {
                console.log(err);
                res.status(400).json({message:'No se pudo consultar a la base de datos', error: err})
            }
            connection.release();

        });
    })
})
export default conversion;

