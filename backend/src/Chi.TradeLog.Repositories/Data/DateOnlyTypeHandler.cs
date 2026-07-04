using System.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Data;

/// <summary>
/// Dapper 型別處理器：在 <see cref="DateOnly"/> 與資料庫的 <c>date</c> 之間轉換。
/// Npgsql 讀取 <c>date</c> 時可能回傳 <see cref="DateTime"/>，故在此明確轉型。
/// </summary>
public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    /// <inheritdoc />
    public override DateOnly Parse(object value) => value switch
    {
        DateOnly dateOnly => dateOnly,
        DateTime dateTime => DateOnly.FromDateTime(dateTime),
        _ => DateOnly.FromDateTime(Convert.ToDateTime(value)),
    };

    /// <inheritdoc />
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value = value;
    }
}
