﻿var express = require('express');
var router = express.Router();
var email = require('emailjs');
var pdf = require('html-pdf');
var _ = require('underscore')._;
var fs = require('fs');
var CONSTANTES = require('../../utils/constantes');
var crypto = require('crypto');
var config = require('../../utils/config');
var utils = require('../../utils/utils');
var sql = require('mssql');
var async = require('async');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

//gales



//AUTENTICAR USUARIO
router.post('/get_autenticar_ususario', function (req, res, next) {
    console.log(req.body);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_USUARIO", sql.VarChar(30), req.body.usuario.toUpperCase());
        request.input("IN_PASSWORD", sql.VarChar(30), req.body.password);

        request.output('MSG', sql.VarChar);

        request.execute('GALES.GET_AUTENTICAR_USUSARIO', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets,
                'MSG': request.parameters.MSG.value
            });
        });

    });
});



//CONSULTA LA INFORMACION DEL CLIENTE
router.get('/get_informacion_cliente/:documentoCliente', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_DOCUMENTO", sql.VarChar(20), req.params.documentoCliente);
        request.execute('GALES.GET_INFORMACION_CLIENTE', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





//GET CONSECUTO COTIZACION 
router.post('/generar_consecutivo_cotizacion/:tipo_cotizacion/:idUsuario', function (req, res, next) {

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }
        // Stored Procedure
        var request = new sql.Request(connection);
        request.verbose = false;
        request.input("IN_TIPO_COTIZACION", sql.VarChar, req.params.tipo_cotizacion);
        request.input("IN_ID_USUARIO", sql.Int, req.params.idUsuario);
        request.output("MSG", sql.VarChar);
        request.output("OUT_CS_COTIZACION", sql.Int);

        request.execute('GALES.GENERAR_CONSECUTIVO_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
                return;
            }

            res.json({
                data: recordsets,
                'MSG': request.parameters.MSG.value,
                'OUT_CS_COTIZACION': request.parameters.OUT_CS_COTIZACION.value,
            });
        });

    });

});




//INSERTAR ENCABEZADO COTIZACION 
router.post('/insert_h_Cotizacion', function (req, res, next) {

    console.log(req.body);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);

        //request.verbose = true;
        request.input("IN_DOCUMENTO_CLIENTE", sql.VarChar, req.body.documento_cliente);
        request.input("IN_NOMBRES_CLIENTE", sql.VarChar, req.body.nombre_cliente);
        request.input("IN_EMAIL_CLIENTE", sql.VarChar, req.body.email);
        request.input("IN_TIPO_COTIZACION", sql.VarChar, req.body.tipo_cotizacion);
        request.input('IN_FECHA', sql.DateTime, new Date(req.body.fecha_cotizacion));
        request.input("IN_ID_USUARIO", sql.Int, req.body.cs_id_usuario);
        request.input("IN_C_FORMA_PAGO", sql.Int, req.body.c_forma_pago);
        request.input("IN_CS_COTIZACION", sql.BigInt, req.body.cs_cotizacion);
        request.input("IN_VENDEDOR", sql.VarChar, req.body.codigo_vendedor);

        request.output("OUT_CS_H_COTIZACION", sql.VarChar);
        request.output("MSG", sql.VarChar);

        request.execute('GALES.INSERT_H_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value,
                            'OUT_CS_H_COTIZACION': request.parameters.OUT_CS_H_COTIZACION.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



//CONSULTA LOS PRODUCTOS DESARROLLADOS PARA LLENAR EL COMBO DE BUSQUEDA
router.get('/get_productos', function (req, res, next) {
    //  console.log(req.params);
    //return;
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('GALES.GET_PRODUCTOS', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});





//INSERTAR ENCABEZADO COTIZACION 
router.post('/insert_productos_cotizacion', function (req, res, next) {

    console.log(req.body);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);

        request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_REFERENCIA_PT", sql.VarChar, req.body.REFERENCIA_PT);
        request.input("IN_D_REFERENCIA_PT", sql.VarChar, req.body.D_REFERENCIA_PT);
        request.input('IN_ID_ITEM', sql.VarChar, req.body.ID_ITEM);
        request.input("IN_ID_LOCALIZACION", sql.VarChar, req.body.ID_LOCALIZACION);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.UNIDAD_MEDIDA);
        request.input("IN_C_LISTA_PRECIO", sql.VarChar, req.body.C_LISTA_PRECIO);
        request.input("IN_D_LISTA_PRECIO", sql.VarChar, req.body.D_LISTA_PRECIO);
        request.input("IN_CANTIDAD", sql.Decimal(12, 2), req.body.CANTIDAD);
        request.input("IN_VALOR", sql.Decimal(24, 2), req.body.VALOR || 0);
        request.input("IN_LOG_USER", sql.Int, req.body.ID_USUARIO);
        request.output("OUT_CS_ID_DT_COTIZACION", sql.BigInt);
        request.output("MSG", sql.VarChar);

        request.execute('GALES.INSERT_DT_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value,
                            'OUT_CS_ID_DT_COTIZACION': request.parameters.OUT_CS_ID_DT_COTIZACION.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


//CONSULTA LAS COTIZACIONES REALIZADAS POR UN USUARIO
router.get('/get_cotizaciones_by_usuario/:idUsuario', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_ID_USUARIO", sql.Int, req.params.idUsuario);
        request.execute('GALES.GET_COTIZACIONES_BY_USUARIO', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



//CONSULTA EL DETALLE DE CADA ITEM DE UNA COTIZACION 
router.get('/get_detalle_cotizacion/:csIdCotizacion', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.params.csIdCotizacion);
        request.execute('GALES.GET_DETALLE_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



// ===================================================================================================================


router.get('/prueba', function (req, res, next) {
    //  console.log(req.params);
    //return;
    config.configBD2.database = CONSTANTES.POSDB;
    console.log(config.configBD2.database);
    var connection = new sql.Connection(utils.clone(config.configBD2), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('POSMADECENTRO.SSP_GET_CIUDADES', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

//PRUEBA SERVIDOR 192.168.1.20 RTA
router.get('/get_tipos_proyectos', function (req, res, next) {
    //  console.log(req.params);
    //return;
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('RTA.SSP_GET_PRUEBA', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

//CONSULTA EL PRODUCTO DESARROLLADO CON SUSMATERIALES FILTRANDO POR EL PARAMETRO ID_ITEM
router.get('/get_materiales_productos_desarrollados/:idItemReferencia', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_ID_ITEM_REFERENCIA", sql.VarChar(6), req.params.idItemReferencia);
        request.execute('RTA.GET_MATERIALES_PRODUCTOS_DESARROLLADOS', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});



router.post('/insert_productos_cotizacion_1', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_C_CIDIS", sql.VarChar, req.body.C_CIDIS);
        request.input("IN_REFERENCIA_PT", sql.VarChar, req.body.ID_REFERENCIA);
        request.input("IN_D_REFERENCIA_PT", sql.VarChar, req.body.DESCRIPCION);
        request.input('IN_ID_ITEM', sql.VarChar, req.body.ID_ITEM);
        request.input("IN_ID_PROCEDENCIA", sql.VarChar, req.body.ID_PROCEDENCIA);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.UNIDAD_MEDIDA);
        request.input("IN_EMPAQUE_H", sql.Decimal(12, 2), req.body.EMPAQUE_H);
        request.input("IN_EMPAQUE_W", sql.Decimal(12, 2), req.body.EMPAQUE_W);
        request.input("IN_EMPAQUE_D", sql.Decimal(12, 2), req.body.EMPAQUE_D);
        request.input("IN_CUBICAGE_C", sql.Decimal(12, 2), req.body.CUBICAGE_C);
        request.input("IN_CUBICAGE_K", sql.Decimal(12, 2), req.body.CUBICAGE_K);
        request.input("IN_MEDIDAS_PT", sql.VarChar, req.body.MEDIDAS_PT);
        request.input("IN_COLOR", sql.VarChar, req.body.COLOR);
        request.input("IN_CANTIDAD", sql.Decimal(24, 2), req.body.CANTIDAD);
        request.input("IN_ULTIMO_COSTO", sql.Decimal(24, 2), req.body.ULTIMO_COSTO || 0);
        request.input("IN_CANTIDAD_UC", sql.Decimal(24, 2), req.body.CANTIDAD_UC || 0);
        request.input("IN_VALOR_CLIENTE", sql.Decimal(24, 2), req.body.data_totales.costo_cliente || 0);
        request.input("IN_MARGEN", sql.Decimal(10, 2), req.body.MARGEN);

        request.input("IN_PJ_DSCTO", sql.Decimal(10, 2), req.body.PJ_DSCTO);
        request.input("IN_VR_DSCTO", sql.Decimal(24, 2), req.body.data_totales.descuento || 0);
        request.input("IN_VARIACION", sql.Decimal(24, 2), req.body.data_totales.variacion || 0);
        request.input("IN_MANO_OBRA", sql.Decimal(24, 2), req.body.data_totales.mano_obra || 0);
        request.input("IN_CIF", sql.Decimal(24, 2), req.body.data_totales.cif || 0);
        request.input("IN_TOTAL_PRODUCTO", sql.Decimal(24, 2), req.body.data_totales.total || 0);

        request.input("IN_LOG_USER", sql.Int, req.body.ID_USUARIO);

        request.output("OUT_CS_ID_DT_COTIZACION", sql.VarChar);
        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_DT_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {

                    var cantInsumosProducto = req.body.data_insumo_producto.length;

                    /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                    async.each(req.body.data_insumo_producto, function (item, callback) {

                        var requestDt = new sql.Request(transaction);
                        requestDt.verbose = false;
                        requestDt.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, request.parameters.OUT_CS_ID_DT_COTIZACION.value);
                        requestDt.input("IN_ID_COD_ITEM_INS", sql.VarChar, item.ID_COD_ITEM_C);
                        requestDt.input("IN_REFERENCIA_INS", sql.VarChar, item.ID_REFER_C);
                        requestDt.input("IN_D_REFERENCIA_INS", sql.VarChar, item.DESCRIPCION_C);
                        requestDt.input("IN_UNIDAD_MEDIDA_INS", sql.VarChar, item.ID_UNIMED_C);
                        requestDt.input("IN_CANTIDAD_BASE", sql.Decimal(20, 5), item.CANTIDAD_BASE);
                        requestDt.input("IN_CANTIDAD_REQUERIDA", sql.Decimal(20, 5), item.CANTIDAD_REQUERIDA);
                        requestDt.input("IN_CANTIDAD_SOLICITADA", sql.Decimal(20, 5), item.CANTIDAD_SOLICITADA);
                        requestDt.input("IN_BODEGA_CONSUMO", sql.VarChar, item.BODEGA_CONSUMO);
                        requestDt.input("IN_COSTO_PROM_FINAL", sql.Decimal(20, 5), item.COSTO_PROM_FINAL);

                        requestDt.output("MSG", sql.VarChar);

                        requestDt.execute('RTA.SSP_INSERT_MV_INSUMOS_COTIZACIONES', function (err, recordsets, returnValue) {
                            if (err) {
                                // ... error checks
                                callback(err.message);

                            } else if (requestDt.parameters.MSG.value !== "OK") {
                                callback(requestDt.parameters.MSG.value);
                            } else {
                                cantInsumosProducto--;
                                callback();
                            }

                        });
                    },
                        function (err) {

                            if (err) {
                                transaction.rollback(function (err2) {
                                });
                                return res.json({
                                    error: "err",
                                    MSG: err
                                });

                            } else {

                                if (cantInsumosProducto === 0) {

                                    /*hacemos commit*/
                                    transaction.commit(function (err, recordset) {
                                        // ... error checks
                                        res.json({
                                            data: [],
                                            'MSG': request.parameters.MSG.value,
                                            OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                                        });

                                        console.log("Transaction commited.");
                                    });
                                }
                            }
                        });
                }
            }
        });/**/
    });
});

//INSERTAR DATA COSTOS MDC 
router.post('/insert_data_costos_mdc', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }


        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_DESCRIPCION_ARCHIVO", sql.VarChar, req.body.dataHeader.descripcionArchivo);
        request.input("IN_LOG_USER", sql.Int, req.body.dataHeader.csIdUsuario);

        request.output("OUT_CS_ID_COSTOS_MDC", sql.BigInt);
        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_H_COSTOS_PRODUCTOS_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {

                    var cant = req.body.dataDetalle.length;

                    /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                    async.each(req.body.dataDetalle, function (item, callback) {

                        var requestDt = new sql.Request(transaction);
                        requestDt.verbose = false;
                        requestDt.input("IN_CS_ID_COSTOS_MDC", sql.BigInt, request.parameters.OUT_CS_ID_COSTOS_MDC.value);
                        requestDt.input("IN_REFERENCIA", sql.VarChar, item.REFERENCIA);
                        requestDt.input("IN_D_REFERENCIA", sql.VarChar, item.DESCRIPCION);
                        requestDt.input("IN_UM", sql.VarChar, item.UNIMED);
                        requestDt.input("IN_LOG_USER", sql.Int, req.body.dataHeader.csIdUsuario);

                        requestDt.input("IN_COSTO_MDC", sql.Decimal(20, 5), item.COSTOMDC);

                        requestDt.output("MSG", sql.VarChar);

                        requestDt.execute('RTA.SSP_INSERT_MV_COSTOS_PRODUCTOS_MDC', function (err, recordsets, returnValue) {
                            if (err) {
                                // ... error checks
                                callback(err.message);

                            } else if (requestDt.parameters.MSG.value !== "OK") {
                                callback(requestDt.parameters.MSG.value);
                            } else {
                                cant--;
                                callback();
                            }

                        });
                    },
                        function (err) {

                            if (err) {
                                transaction.rollback(function (err2) {
                                });
                                return res.json({
                                    error: "err",
                                    MSG: err
                                });

                            } else {

                                if (cant === 0) {

                                    /*hacemos commit*/
                                    transaction.commit(function (err, recordset) {
                                        // ... error checks
                                        res.json({
                                            data: [],
                                            'MSG': request.parameters.MSG.value,
                                            OUT_CS_ID_COSTOS_MDC: request.parameters.OUT_CS_ID_COSTOS_MDC.value
                                        });

                                        console.log("Transaction commited.");
                                    });
                                }
                            }
                        });

                    ///*hacemos commit*/
                    //transaction.commit(function (err, recordset) {
                    //    // ... error checks
                    //    res.json({
                    //        data: [],
                    //        'MSG': request.parameters.MSG.value,
                    //        OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                    //    });

                    //    console.log("Transaction commited.");
                    //});
                }
            }
        });
    });
});

router.post('/delete_producto_dt_cotizacion', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.body.CS_ID_DT_COTIZACION);

        request.output("MSG", sql.VarChar);

        request.execute('GALES.SSP_DELETE_PRODUCTO_DT_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});

router.post('/update_estado_h_cotizaciones', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_ESTADO_COTIZACION", sql.Int, req.body.ESTADO_COTIZACION);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.ID_USUARIO);

        request.output("MSG", sql.VarChar);

        request.execute('GALES.UPDATE_ESTADO_H_COTIZACIONES', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});



router.get('/get_costos_productos_insumos_rta_mdc', function (req, res, next) {
    //  console.log(req.params);
    //return;
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('RTA.GET_COSTOS_INSUMOS_RTA_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.get('/get_historico_costos_mdc', function (req, res, next) {
    //  console.log(req.params);
    //return;
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;

        request.execute('RTA.GET_HISTORICO_COSTOS_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});




router.post('/anular_costos_mdc', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        request.verbose = true;
        request.input("IN_CS_ID_COSTO", sql.BigInt, req.body.cdIdCostos);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.csIdUsuario);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.ANULAR_COSTOS_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});


router.get('/get_detalle_archivo_costos_mdc/:cs_id_costos', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_CS_COSTOS", sql.BigInt, req.params.cs_id_costos);

        request.execute('RTA.GET_DETALLE_ARCHIVO_COSTOS_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});


router.get('/get_insumos_by_producto_cotizacion/:cs_id_dt_cotizacion', function (req, res, next) {
    console.log(req.params);

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);
        //request.verbose = true;
        request.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.params.cs_id_dt_cotizacion);

        request.execute('RTA.SSP_GET_INSUMOS_BY_PRODUCTO_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

router.post('/editar_producto_dt_cotizacion', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var requestD = new sql.Request(transaction);
        //request.verbose = true;
        requestD.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, req.body.CS_ID_DT_COTIZACION);

        requestD.output("MSG", sql.VarChar);

        requestD.execute('RTA.SSP_DELETE_PRODUCTO_DT_COTIZACION', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (requestD.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: requestD.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {

                    var request = new sql.Request(transaction);
                    request.verbose = true;
                    request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
                    request.input("IN_C_CIDIS", sql.VarChar, req.body.C_CIDIS);
                    request.input("IN_REFERENCIA_PT", sql.VarChar, req.body.ID_REFERENCIA);
                    request.input("IN_D_REFERENCIA_PT", sql.VarChar, req.body.DESCRIPCION);
                    request.input('IN_ID_ITEM', sql.VarChar, req.body.ID_ITEM);
                    request.input("IN_ID_PROCEDENCIA", sql.VarChar, req.body.ID_PROCEDENCIA);
                    request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.UNIDAD_MEDIDA);
                    request.input("IN_EMPAQUE_H", sql.Decimal(12, 2), req.body.EMPAQUE_H);
                    request.input("IN_EMPAQUE_W", sql.Decimal(12, 2), req.body.EMPAQUE_W);
                    request.input("IN_EMPAQUE_D", sql.Decimal(12, 2), req.body.EMPAQUE_D);
                    request.input("IN_CUBICAGE_C", sql.Decimal(12, 2), req.body.CUBICAGE_C);
                    request.input("IN_CUBICAGE_K", sql.Decimal(12, 2), req.body.CUBICAGE_K);
                    request.input("IN_MEDIDAS_PT", sql.VarChar, req.body.MEDIDAS_PT);
                    request.input("IN_COLOR", sql.VarChar, req.body.COLOR);
                    request.input("IN_CANTIDAD", sql.Decimal(24, 2), req.body.CANTIDAD);
                    request.input("IN_ULTIMO_COSTO", sql.Decimal(24, 2), req.body.ULTIMO_COSTO || 0);
                    request.input("IN_CANTIDAD_UC", sql.Decimal(24, 2), req.body.CANTIDAD_UC || 0);
                    request.input("IN_VALOR_CLIENTE", sql.Decimal(24, 2), req.body.data_totales.costo_cliente || 0);
                    request.input("IN_MARGEN", sql.Decimal(10, 2), req.body.MARGEN);

                    request.input("IN_PJ_DSCTO", sql.Decimal(10, 2), req.body.PJ_DSCTO);
                    request.input("IN_VR_DSCTO", sql.Decimal(24, 2), req.body.data_totales.descuento || 0);
                    request.input("IN_VARIACION", sql.Decimal(24, 2), req.body.data_totales.variacion || 0);
                    request.input("IN_MANO_OBRA", sql.Decimal(24, 2), req.body.data_totales.mano_obra || 0);
                    request.input("IN_CIF", sql.Decimal(24, 2), req.body.data_totales.cif || 0);
                    request.input("IN_TOTAL_PRODUCTO", sql.Decimal(24, 2), req.body.data_totales.total || 0);

                    request.input("IN_LOG_USER", sql.Int, req.body.ID_USUARIO);

                    request.output("OUT_CS_ID_DT_COTIZACION", sql.VarChar);
                    request.output("MSG", sql.VarChar);

                    request.execute('RTA.SSP_INSERT_DT_COTIZACION', function (err, recordsets, returnValue) {
                        if (err) {
                            res.json({
                                error: err,
                                MSG: err.message
                            });
                            transaction.rollback(function (err) {
                                // ... error checks
                                return;
                            });
                        } else {

                            if (request.parameters.MSG.value != "OK") {
                                //res.status(500);
                                res.json({
                                    error: "err",
                                    MSG: request.parameters.MSG.value

                                });
                                transaction.rollback(function (err2) {
                                    // ... error checks

                                });
                            } else {

                                var cantInsumosProducto = req.body.data_insumo_producto.length;

                                /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                                async.each(req.body.data_insumo_producto, function (item, callback) {

                                    var requestDt = new sql.Request(transaction);
                                    requestDt.verbose = false;
                                    requestDt.input("IN_CS_ID_DT_COTIZACION", sql.BigInt, request.parameters.OUT_CS_ID_DT_COTIZACION.value);
                                    requestDt.input("IN_ID_COD_ITEM_INS", sql.VarChar, item.ID_COD_ITEM_C);
                                    requestDt.input("IN_REFERENCIA_INS", sql.VarChar, item.ID_REFER_C);
                                    requestDt.input("IN_D_REFERENCIA_INS", sql.VarChar, item.DESCRIPCION_C);
                                    requestDt.input("IN_UNIDAD_MEDIDA_INS", sql.VarChar, item.ID_UNIMED_C);
                                    requestDt.input("IN_CANTIDAD_BASE", sql.Decimal(20, 5), item.CANTIDAD_BASE);
                                    requestDt.input("IN_CANTIDAD_REQUERIDA", sql.Decimal(20, 5), item.CANTIDAD_REQUERIDA);
                                    requestDt.input("IN_CANTIDAD_SOLICITADA", sql.Decimal(20, 5), item.CANTIDAD_SOLICITADA);
                                    requestDt.input("IN_BODEGA_CONSUMO", sql.VarChar, item.BODEGA_CONSUMO);
                                    requestDt.input("IN_COSTO_PROM_FINAL", sql.Decimal(20, 5), item.COSTO_PROM_FINAL);

                                    requestDt.output("MSG", sql.VarChar);

                                    requestDt.execute('RTA.SSP_INSERT_MV_INSUMOS_COTIZACIONES', function (err, recordsets, returnValue) {
                                        if (err) {
                                            // ... error checks
                                            callback(err.message);

                                        } else if (requestDt.parameters.MSG.value !== "OK") {
                                            callback(requestDt.parameters.MSG.value);
                                        } else {
                                            cantInsumosProducto--;
                                            callback();
                                        }

                                    });
                                },
                                    function (err) {

                                        if (err) {
                                            transaction.rollback(function (err2) {
                                            });
                                            return res.json({
                                                error: "err",
                                                MSG: err
                                            });

                                        } else {

                                            if (cantInsumosProducto === 0) {

                                                /*hacemos commit*/
                                                transaction.commit(function (err, recordset) {
                                                    // ... error checks
                                                    res.json({
                                                        data: [],
                                                        'MSG': request.parameters.MSG.value,
                                                        OUT_CS_ID_DT_COTIZACION: request.parameters.OUT_CS_ID_DT_COTIZACION.value
                                                    });

                                                    console.log("Transaction commited.");
                                                });
                                            }
                                        }
                                    });
                            }
                        }
                    });/**/

                    ///*hacemos commit*/
                    //transaction.commit(function (err, recordset) {
                    //    // ... error checks
                    //    res.json({
                    //        data: [],
                    //        'MSG': request.parameters.MSG.value
                    //    });

                    //    console.log("Transaction commited.");
                    //});
                }
            }
        });
    });
});







router.post('/update_costo_mdc', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID", sql.BigInt, req.body.cdIdCosto);
        request.input("IN_COSTO_MDC", sql.Decimal(24, 4), req.body.ESTADO_COTIZACION);
        request.input("IN_UNIDAD_MEDIDA", sql.VarChar, req.body.unidadMededida);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_UPDATE_COSTO_MDC', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});

router.get('/get_productos_desarrollados_for_gestion_imagen', function (req, res, next) {

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);

        request.execute('RTA.SSP_GET_PRODUCTOS_DESARROLLADOS_FOR_GESTION_IMAGEN', function (err, recordsets, returnValue) {
            if (err) {
                res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});

router.post('/almacenar_imagen_producto', multipartMiddleware, function (req, res) {

    var tamaño = 0;
    var files;
    if (req.files.file != undefined) {
        files = [].concat(req.files.file);
        tamaño = Object.keys(files).length;
        console.log("tamaño:  " + tamaño);
    }

    if (tamaño > 0) {

        var contador = Object.keys(files).length;
        files.forEach(function (item) {

            var ext = "png";// (item.name).split('.');
            //ext = ext[ext.length - 1];

            var nombre_archivo = req.body.ID_ITEM;
            var rutaFisicaServidor = config.pathBaseGestionDocumental + config.rutaImgProductos;

            var newPath = rutaFisicaServidor + "/" + nombre_archivo + "." + ext;

            fs.exists(rutaFisicaServidor, function (exists) {
                if (exists) {
                    fs.readFile(item.path, function (err, data) {
                        var imageName = item.name;
                        /// If there's an error
                        if (!imageName) {

                            res.end();
                        } else {

                            console.log(newPath);

                            /*escribimos los archivos en la ruta indicada*/
                            fs.writeFile(newPath, data, function (err) {
                                if (err) {

                                    res.json({
                                        error: err,
                                        MSG: err.message
                                    });

                                } else {

                                    contador--;

                                    if (contador == 0) {

                                        res.json({
                                            data: [],
                                            'MSG': "OK"
                                        });
                                    }
                                }
                            });
                        }
                    });
                } else {
                    res.json({
                        'MSG': "No se encontró la ruta " + rutaFisicaServidor
                    });
                }
            });
        });
    }
});

router.get('/get_all_materiales_productos_desarrollados', function (req, res, next) {

    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);
    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            return res.json(err);
        }

        // Stored Procedure
        var request = new sql.Request(connection);

        request.execute('RTA.SSP_GET_ALL_MATERIALES_PRODUCTOS_DESARROLLADOS', function (err, recordsets, returnValue) {
            if (err) {
                return res.json(err);
            }

            res.json({
                data: recordsets
            });
        });

    });
});






router.post('/insertEspesores', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_ESTADO_COTIZACION", sql.Int, req.body.ESTADO_COTIZACION);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.ID_USUARIO);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_ESPESORES', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});









router.post('/insertManoObra', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;
        request.input("IN_CS_ID_COTIZACION", sql.BigInt, req.body.CS_H_COTIZACION);
        request.input("IN_ESTADO_COTIZACION", sql.Int, req.body.ESTADO_COTIZACION);
        request.input("IN_USUARIO_UPDATE", sql.Int, req.body.ID_USUARIO);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_MANO_OBRA_CIF', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {
                    /*hacemos commit*/
                    transaction.commit(function (err, recordset) {
                        // ... error checks
                        res.json({
                            data: [],
                            'MSG': request.parameters.MSG.value
                        });

                        console.log("Transaction commited.");
                    });
                }
            }
        });
    });
});











router.post('/insert_nuevo_producto', function (req, res, next) {
    config.configBD3.database = CONSTANTES.RTABD;
    console.log(config.configBD3.database);

    var connection = new sql.Connection(utils.clone(config.configBD3), function (err) {
    });
    var transaction = new sql.Transaction(connection);

    transaction.begin(function (err) {
        // ... error checks
        if (err) {
            console.error(err);
            //res.status(err.status || 500);
            res.json({
                error: err,
                MSG: err.message
            });
        }

        // Stored Procedure
        var request = new sql.Request(transaction);
        //request.verbose = true;

        request.input("IN_ID_ITEM", sql.VarChar, req.body.datos_item.ID_ITEM);
        request.input("IN_ID_EXT_ITM", sql.VarChar, req.body.datos_item.ID_EXT_ITM || "");
        request.input("IN_ID_REFERENCIA", sql.VarChar, req.body.datos_item.ID_REFERENCIA || "");
        request.input("IN_ID_CODBAR", sql.VarChar, req.body.datos_item.ID_CODBAR || "");
        request.input("IN_DESCRIPCION", sql.VarChar, req.body.datos_item.DESCRIPCION || "");
        request.input("IN_DESCRIPCION_2", sql.VarChar, req.body.datos_item.DESCRIPCION_2 || "");
        request.input("IN_ID_PROCEDENCIA", sql.VarChar, req.body.datos_item.ID_PROCEDENCIA || "");
        request.input("IN_ID_TIPO", sql.VarChar, req.body.datos_item.ID_TIPO || "");
        request.input("IN_ID_LINEA1_6", sql.VarChar, req.body.datos_item.ID_LINEA1_6 || "");
        request.input("IN_ID_LINEA1", sql.VarChar, req.body.datos_item.ID_LINEA1 || "");
        request.input("IN_ID_LINEA3_6", sql.VarChar, req.body.datos_item.ID_LINEA3_6 || "");
        request.input("IN_ID_LINEA2", sql.VarChar, req.body.datos_item.ID_LINEA2 || "");
        request.input("IN_ID_LINEA5_6", sql.VarChar, req.body.datos_item.ID_LINEA5_6 || "");
        request.input("IN_ID_LINEA", sql.VarChar, req.body.datos_item.ID_LINEA || "");
        request.input("IN_ID_GRUPO1_6", sql.VarChar, req.body.datos_item.ID_GRUPO1_6 || "");
        request.input("IN_ID_GRUPO1", sql.VarChar, req.body.datos_item.ID_GRUPO1 || "");
        request.input("IN_ID_GRUPO3_6", sql.VarChar, req.body.datos_item.ID_GRUPO3_6 || "");
        request.input("IN_ID_GRUPO2", sql.VarChar, req.body.datos_item.ID_GRUPO2 || "");
        request.input("IN_ID_GRUPO5_6", sql.VarChar, req.body.datos_item.ID_GRUPO5_6 || "");
        request.input("IN_ID_GRUPO", sql.VarChar, req.body.datos_item.ID_GRUPO || "");
        request.input("IN_ID_GRUCON", sql.VarChar, req.body.datos_item.ID_GRUCON || "");
        request.input("IN_ID_CRICLA1", sql.VarChar, req.body.datos_item.ID_CRICLA1 || "");
        request.input("IN_ID_CRICLA2", sql.VarChar, req.body.datos_item.ID_CRICLA2 || "");
        request.input("IN_ID_CRICLA3", sql.VarChar, req.body.datos_item.ID_CRICLA3 || "");
        request.input("IN_ID_CRICLA4", sql.VarChar, req.body.datos_item.ID_CRICLA4 || "");
        request.input("IN_ESTADO", sql.VarChar, req.body.datos_item.ESTADO || "");
        request.input("IN_UNIMED_INV_1", sql.VarChar, req.body.datos_item.UNIMED_INV_1 || "");
        request.input("IN_UNIMED_INV_2", sql.VarChar, req.body.datos_item.UNIMED_INV_2 || "");
        request.input("IN_FACTOR_INV_2", sql.Decimal(20, 4), req.body.datos_item.FACTOR_INV_2 || 0);
        request.input("IN_UNIMED_EMPAQ", sql.VarChar, req.body.datos_item.UNIMED_EMPAQ || "");
        request.input("IN_FACTOR_EMPAQ", sql.Decimal(20, 4), req.body.datos_item.FACTOR_EMPAQ || 0);
        request.input("IN_PESO", sql.Decimal(20, 4), req.body.datos_item.PESO || 0);
        request.input("IN_VOLUMEN", sql.Decimal(20, 4), req.body.datos_item.VOLUMEN || 0);
        request.input("IN_ID_CURVA", sql.VarChar, req.body.datos_item.ID_CURVA || "");
        request.input("IN_IMPUESTO", sql.VarChar, req.body.datos_item.IMPUESTO || "");
        request.input("IN_RTEFTE", sql.VarChar, req.body.datos_item.RTEFTE || "");
        request.input("IN_IND_CLASIF", sql.VarChar, req.body.datos_item.IND_CLASIF || "");
        request.input("IN_ID_BODEGA_DEFAULT", sql.VarChar, req.body.datos_item.ID_BODEGA_DEFAULT || "");
        request.input("IN_COSTO_EST_ESTENIV", sql.Decimal(20, 4), req.body.datos_item.COSTO_EST_ESTENIV || 0);
        request.input("IN_COSTO_EST_ACUM", sql.Decimal(20, 4), req.body.datos_item.COSTO_EST_ACUM || 0);
        request.input("IN_COSTO_ACT_ESTENIV", sql.Decimal(20, 4), req.body.datos_item.COSTO_ACT_ESTENIV || 0);
        request.input("IN_COSTO_ACT_ACUM", sql.Decimal(20, 4), req.body.datos_item.COSTO_ACT_ACUM || 0);
        request.input("IN_ULTIMO_COSTO_ED", sql.Decimal(20, 4), req.body.datos_item.ULTIMO_COSTO_ED || 0);
        request.input("IN_ID_TERC", sql.VarChar, req.body.datos_item.ID_TERC || "");
        request.input("IN_NOM_TERC", sql.VarChar, req.body.datos_item.NOM_TERC || "");
        request.input("IN_DESC_ITEM_PADRE", sql.VarChar, req.body.datos_item.DESC_ITEM_PADRE || "");
        request.input("IN_ARANCELARIA", sql.VarChar, req.body.datos_item.ARANCELARIA || "");
        request.input("IN_REFERENCIA_ALT", sql.VarChar, req.body.datos_item.REFERENCIA_ALT || "");
        request.input("IN_ID_TALLA", sql.VarChar, req.body.datos_item.ID_TALLA || "");
        request.input("IN_ID_ESTADO", sql.VarChar, req.body.datos_item.ID_ESTADO || "");
        request.input("IN_ID_RTE_RENTA", sql.VarChar, req.body.datos_item.ID_RTE_RENTA || "");
        request.input("IN_ID_BASE_RENTA", sql.VarChar, req.body.datos_item.ID_BASE_RENTA || "");
        request.input("IN_ID_PLAN_MAESTRO", sql.VarChar, req.body.datos_item.ID_PLAN_MAESTRO || "");
        request.input("IN_ID_EXIGE_OP", sql.VarChar, req.body.datos_item.ID_EXIGE_OP || "");
        request.input("IN_ID_POLIT_ORDEN", sql.VarChar, req.body.datos_item.ID_POLIT_ORDEN || "");
        request.input("IN_TAM_PROM_LOTE", sql.Decimal(20, 4), req.body.datos_item.TAM_PROM_LOTE || 0);
        request.input("IN_TIEMPO_SEG", sql.VarChar, req.body.datos_item.TIEMPO_SEG || "");
        request.input("IN_INV_SEG", sql.Decimal(20, 4), req.body.datos_item.INV_SEG || 0);
        request.input("IN_PER_CUBRIM", sql.VarChar, req.body.datos_item.PER_CUBRIM || "");
        request.input("IN_TIEMPO_REP", sql.VarChar, req.body.datos_item.TIEMPO_REP || "");
        request.input("IN_ID_CRITICO", sql.VarChar, req.body.datos_item.ID_CRITICO || "");
        request.input("IN_BODEGA_DEFAULT", sql.VarChar, req.body.datos_item.BODEGA_DEFAULT || "");
        request.input("IN_MIN_ORDENAR", sql.Decimal(20, 4), req.body.datos_item.MIN_ORDENAR || 0);
        request.input("IN_MAX_ORDENAR", sql.Decimal(20, 4), req.body.datos_item.MAX_ORDENAR || 0);
        request.input("IN_INCREM_ORDENAR", sql.Decimal(20, 4), req.body.datos_item.INCREM_ORDENAR || 0);
        request.input("IN_PORC_DESPER", sql.Decimal(20, 4), req.body.datos_item.PORC_DESPER || 0);
        request.input("IN_COD_RUTA", sql.VarChar, req.body.datos_item.COD_RUTA || "");
        request.input("IN_COD_LISMAT", sql.VarChar, req.body.datos_item.COD_LISMAT || "");
        request.input("IN_EXT_DEFAULT", sql.VarChar, req.body.datos_item.EXT_DEFAULT || "");
        request.input("IN_UNIMED_COM", sql.VarChar, req.body.datos_item.UNIMED_COM || "");
        request.input("IN_FACTOR_COM", sql.Decimal(20, 4), req.body.datos_item.FACTOR_COM || 0);

        request.output("MSG", sql.VarChar);

        request.execute('RTA.SSP_INSERT_NUEVO_PRODUCTO', function (err, recordsets, returnValue) {
            if (err) {
                res.json({
                    error: err,
                    MSG: err.message
                });
                transaction.rollback(function (err) {
                    // ... error checks
                    return;
                });
            } else {

                if (request.parameters.MSG.value != "OK") {
                    //res.status(500);
                    res.json({
                        error: "err",
                        MSG: request.parameters.MSG.value

                    });
                    transaction.rollback(function (err2) {
                        // ... error checks

                    });
                } else {

                    var cantRegistrosInsumos = Object.keys(req.body.insumos_producto).length;

                    /* almacenamos las asignaciones a los operarios del corte para la op seleccionada */
                    async.each(req.body.insumos_producto, function (item, callback) {

                        var requestInsumo = new sql.Request(transaction);

                        requestInsumo.verbose = false;
                        
                        requestInsumo.input("IN_ID_COD_ITEM_P", sql.VarChar, req.body.datos_item.ID_ITEM);
                        requestInsumo.input("IN_ID_EXT_ITEM_P", sql.VarChar, item.ID_EXT_ITEM_P);
                        requestInsumo.input("IN_ID_UNIMED_P", sql.VarChar, item.ID_UNIMED_P);
                        requestInsumo.input("IN_ID_LISTA", sql.VarChar, item.ID_LISTA);
                        requestInsumo.input("IN_CONSECUTIVO", sql.VarChar, item.CONSECUTIVO);
                        requestInsumo.input("IN_ID_COD_ITEM_C", sql.VarChar, item.ID_COD_ITEM_C);
                        requestInsumo.input("IN_ID_EXT_ITEM_C", sql.VarChar, item.ID_EXT_ITEM_C);
                        requestInsumo.input("IN_ID_UNIMED_C", sql.VarChar, item.ID_UNIMED_C);
                        requestInsumo.input("IN_CANTIDAD", sql.Decimal(20, 5), item.CANTIDAD);
                        requestInsumo.input("IN_CANTIDAD_BASE", sql.Decimal(20, 5), item.CANTIDAD_BASE);
                        requestInsumo.input("IN_CANTIDAD_REQUERIDA", sql.Decimal(20, 5), item.CANTIDAD_REQUERIDA);
                        requestInsumo.input("IN_PESO", sql.Decimal(20, 5), item.PESO);
                        requestInsumo.input("IN_VOLUMEN", sql.Decimal(20, 5), item.VOLUMEN);
                        requestInsumo.input("IN_FECHA_INI", sql.VarChar, item.FECHA_INI);
                        requestInsumo.input("IN_FECHA_FIN", sql.VarChar, item.FECHA_FIN);
                        requestInsumo.input("IN_ID_GRUPO_CONSUMO", sql.VarChar, item.ID_GRUPO_CONSUMO);
                        requestInsumo.input("IN_ID_OPERACION", sql.VarChar, item.ID_OPERACION);
                        requestInsumo.input("IN_SOLO_COSTEO", sql.VarChar, item.SOLO_COSTEO);
                        requestInsumo.input("IN_PORC_DESPERDICIO", sql.Decimal(20, 5), item.PORC_DESPERDICIO);
                        requestInsumo.input("IN_TIEMPO_REPOSICION", sql.Decimal(20, 5), item.TIEMPO_REPOSICION);
                        requestInsumo.input("IN_OBSERVACION", sql.VarChar, item.OBSERVACION);
                        requestInsumo.input("IN_BODEGA_CONSUMO", sql.VarChar, item.BODEGA_CONSUMO);
                        requestInsumo.input("IN_PORC_CONSUMO", sql.Decimal(20, 5), item.PORC_CONSUMO);
                        requestInsumo.input("IN_USOS_TALLA1", sql.VarChar, item.USOS_TALLA1);
                        requestInsumo.input("IN_USOS_TALLA2", sql.VarChar, item.USOS_TALLA2);
                        requestInsumo.input("IN_USOS_TALLA3", sql.VarChar, item.USOS_TALLA3);
                        requestInsumo.input("IN_USOS_TALLA4", sql.VarChar, item.USOS_TALLA4);
                        requestInsumo.input("IN_USOS_TALLA5", sql.VarChar, item.USOS_TALLA5);
                        requestInsumo.input("IN_USOS_TALLA6", sql.VarChar, item.USOS_TALLA6);
                        requestInsumo.input("IN_USOS_TALLA7", sql.VarChar, item.USOS_TALLA7);
                        requestInsumo.input("IN_USOS_TALLA8", sql.VarChar, item.USOS_TALLA8);
                        requestInsumo.input("IN_USOS_TALLA9", sql.VarChar, item.USOS_TALLA9);
                        requestInsumo.input("IN_USOS_TALLA10", sql.VarChar, item.USOS_TALLA10);
                        requestInsumo.input("IN_COSTO_EST_MP", sql.Decimal(20, 5), item.COSTO_EST_MP);
                        requestInsumo.input("IN_COSTO_ACT_MP", sql.Decimal(20, 5), item.COSTO_ACT_MP);
                        
                        requestInsumo.output("MSG", sql.VarChar);

                        requestInsumo.execute('RTA.SSP_INSERT_INSUMO_NUEVO_PRODUCTO', function (err, recordsets, returnValue) {
                            if (err) {
                                // ... error checks
                                callback(err.message);

                            } else if (requestInsumo.parameters.MSG.value !== "OK") {
                                callback(requestInsumo.parameters.MSG.value);
                            } else {
                                cantRegistrosInsumos--;
                                callback();
                            }

                        });
                    },
                        function (err) {

                            if (err) {
                                transaction.rollback(function (err2) {
                                });
                                return res.json({
                                    error: "err",
                                    MSG: err
                                });

                            } else {

                                if (cantRegistrosInsumos === 0) {
                                    
                                    transaction.commit(function (err, recordset) {
                                        res.json({
                                            data: [],
                                            MSG: "OK"
                                        });
                                        console.log("Transaction commited.");
                                    });
                                }
                            }
                        });
                    
                    /*hacemos commit*/
                    //transaction.commit(function (err, recordset) {
                    //    // ... error checks
                    //    res.json({
                    //        data: [],
                    //        'MSG': request.parameters.MSG.value
                    //    });

                    //    console.log("Transaction commited.");
                    //});


                }
            }
        });
    });
});

router.post('/generarpdfcotizacion',
    function(req, res, next) {

        //creamos el PDF
        var pathpdf = 'E:' + '/sys_files/' + req.body.nombre_archivo + '.pdf';
        var options = {
            //filename: pathpdf,
            format: 'Letter'
        };

        fs.readFile('./views/cotizacion.html',
            function callback(err, data) {
                if (err) {
                    res.json(err);
                    return;
                }


                var templateHtml = data.toString();

                var contenido = req.body.template;

                //contenido = contenido.replace(/{{nombre_cliente}}/g, req.body.nombre_cliente);
                //contenido = contenido.replace(/{{email_asesor}}/g, req.body.email_asesor);

                ////reemplazamos el valor de la plantilla básica
                templateHtml = templateHtml.replace(/{{contenidoToPdf}}/g, contenido);

                pdf.create(templateHtml, options).toFile(pathpdf,
                    function(err, responseCreate) {

                        function isEmpty(obj) {
                            for (var key in obj) {
                                if (obj.hasOwnProperty(key))
                                    return false;
                            }
                            return true;
                        }

                        if (err && !isEmpty(err)) {
                            console.log(err);
                            return res.json({
                                "MSG": "err",
                                "responseCreate": err
                            });

                        } else {
                            console.log(responseCreate);
                            //guardamos una referencia del PDF  y lo guardamos en gestión documental
                            res.json({
                                "MSG": "OK",
                                "responseCreate": responseCreate
                            });
                        }
                    });

            });


        //res.json('respond with a resource en nueva orden y para el envío de email');

    });

module.exports = router;
