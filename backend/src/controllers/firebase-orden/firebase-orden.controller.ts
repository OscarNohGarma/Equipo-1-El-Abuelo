import { Controller,Get, Post, Body, Param, Delete, Put} from '@nestjs/common';
import { Orden } from 'src/document/modelos';
import { Producto } from 'src/document/producto_model';
import { ProductoEntity } from 'src/producto.entity';
import { FirebaseOrdenService } from 'src/services/firebase-orden/firebase-orden.service';
import { FirebaseMenuService } from 'src/services/firebase_menu/firebase_menu.service';

@Controller('firebase')
export class FirebaseOrdenController {

    constructor(private readonly servicio: FirebaseOrdenService, private readonly servicio2: FirebaseMenuService){}

     // Métodos para Orden
  @Post('/orden/addorden')
  async createNewOrden(@Body() newOrden: Orden): Promise<{ message: string; }> {
    await this.servicio.createEntity(newOrden, "orden");
      return { message: 'Orden creada con éxito '};
  }

  @Get('/orden/getorden')
  async getAllOrden() {
      const orden = await this.servicio.getAllEntities("orden");
      return orden;
  }

  @Get('/orden/getorden/:id')
  async getOrdenById(@Param('id') ordenId: string) {
    var nombres: string[];

      const orden = await this.servicio.getEntityById(ordenId,"orden");
      const menu = await this.servicio2.getAllEntities('menu');
      nombres = orden.productos.map((hashMap) => hashMap["id"]);
      var ordenn = orden.productos;
    //console.log(nombres);  // Mostrar los nombres en consola

    ordenn.forEach((item2) => {
        menu.forEach((item: any) => {
            //console.log(item); // Aquí puedes acceder a cada elemento
            if(item2.id== item.id){
                item2.namee = item.namee; // Aquí se agrega el nombre
                item2.categoria = item.categoria;
                item2.image = item.image;
                item2.precio = item.precio;
                //console.log(item.namee); // Ejemplo: acceder a la clave 'id'
            }
            
          });
    });
    orden.productos = ordenn;
    console.log(ordenn)


      return orden;
  }

  @Delete('/orden/deleteorden/:id')
  async deleteOrdenById(@Param('id') ordenId: string) {
      await this.servicio.deleteEntityById(ordenId,"orden");
      return { message: 'Orden eliminada con éxito' };
  }

  @Put('/orden/updateorden/:id')
  async updateOrden(@Param('id') ordenId: string, @Body() updatedOrden: Orden) {
      await this.servicio.updateEntity(ordenId, updatedOrden,"orden");
      return { message: 'Orden actualizada con éxito' };
  }
}
